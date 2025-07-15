import { encodeFunctionData, Hex, BaseError as ViemError } from "viem";
import { CHAINS } from "~/app/config/chains";
import {
  ChainId,
  StakeTransactionData,
  TransactionData,
  TransactionMode,
  TransactionSpendableAmounts,
} from "~/app/model/types_WIP";
import { UserInputError } from "~/app/tools/handlers/errors";
import { stakewiseVaultDefaultABI } from "./abi/StakewiseVaultDefaultABI";
import {
  estimateContractGas,
  estimateERC20FeesForL2,
  estimateERC20Gas,
  estimateFeesForL2,
  estimateFeesPerGas,
  estimateGas,
  fetchBalance,
  fetchERC20Balance,
} from "./backend/node";
import { getHarvestParams } from "./backend/stakewise";
import { EtherscanERC20Event } from "./backend/types";
import { EvmAddress, EvmChainParams, HexString } from "./types";

const isHexString = (val: string): val is Hex =>
  val?.startsWith && val.startsWith("0x") && /^[0-9a-fA-F]+$/i.test(val.slice(2));

type DeepHexPrefixedValues<T> = {
  [K in keyof T]: T[K] extends string // Check if it's any string type (literal or general)
    ? T[K] extends `${infer R}` // This condition is true for all strings, R captures the content
      ? `0x${R}` // Applies 0x prefix to any string content
      : never // Should not happen for strings
    : T[K] extends object // If not a string, check if it's an object
    ? DeepHexPrefixedValues<T[K]> // Recurse for objects
    : T[K]; // If not string and not object, keep its original type (e.g., number, boolean, null, undefined)
};

async function getTransactionGas(chainId: ChainId, transaction: TransactionData): Promise<bigint> {
  switch (transaction.mode) {
    case TransactionMode.TRANSFER:
      return await estimateGas({
        chainId,
        senderAddress: transaction.senderAddress as EvmAddress,
        recipientAddress: transaction.recipientAddress as EvmAddress,
        amount: transaction.amount ?? 0n,
      });
    case TransactionMode.TRANSFER_TOKEN:
      return await estimateERC20Gas({
        chainId,
        contractAddress: transaction.tokenId as EvmAddress,
        senderAddress: transaction.senderAddress as EvmAddress,
        recipientAddress: transaction.recipientAddress as EvmAddress,
        amount: transaction.amount ?? 0n,
      });

    case TransactionMode.STAKE:
      const harvestParams = await getHarvestParams(chainId, transaction.targetValidatorAddress);

      return harvestParams.canHarvest
        ? await estimateContractGas({
            chainId,
            contractAddress: transaction.targetValidatorAddress as EvmAddress,
            accountAddress: transaction.senderAddress as EvmAddress,
            abi: stakewiseVaultDefaultABI,
            functionName: "updateStateAndDeposit",
            args: [transaction.senderAddress, transaction.targetValidatorAddress, harvestParams.params],
            value: transaction.amount,
          })
        : await estimateContractGas({
            chainId,
            contractAddress: transaction.targetValidatorAddress as EvmAddress,
            accountAddress: transaction.senderAddress as EvmAddress,
            abi: stakewiseVaultDefaultABI,
            functionName: "deposit",
            args: [transaction.senderAddress, transaction.targetValidatorAddress],
            value: transaction.amount,
          });

    default:
      throw new UserInputError(`Unsupported transaction mode ${transaction.mode}`);
  }
}

async function getTransactionFees(chainId: ChainId, transaction: TransactionData): Promise<bigint> {
  const chainParams = CHAINS[chainId].params as EvmChainParams;

  if (chainParams?.isL2Fees) {
    return transaction.mode === TransactionMode.TRANSFER_TOKEN
      ? await estimateERC20FeesForL2({
          chainId,
          contractAddress: transaction.tokenId as EvmAddress,
          senderAddress: transaction.senderAddress as EvmAddress,
          recipientAddress: transaction.recipientAddress as EvmAddress,
          amount: transaction.amount ?? 0n,
        })
      : await estimateFeesForL2({
          chainId,
          senderAddress: transaction.senderAddress as EvmAddress,
          recipientAddress: transaction.recipientAddress as EvmAddress,
          amount: transaction.amount ?? 0n,
        });
  }

  if (!transaction.gas) {
    throw new Error("Missing gas from transaction to compute fees");
  }

  const { maxFeePerGas } = await estimateFeesPerGas(chainId);
  if (maxFeePerGas === undefined) {
    throw new Error("Could not retrieve maxFeePerGas");
  }

  return transaction.gas * maxFeePerGas;
}

async function getTransactionAmount(chainId: ChainId, transaction: TransactionData): Promise<bigint> {
  if (!transaction.useMaxAmount) {
    return transaction.amount as bigint;
  }

  if (transaction.mode === TransactionMode.TRANSFER_TOKEN) {
    const maxSpendable = await getMaxSpendable(chainId, transaction);
    return maxSpendable.token!;
  } else {
    const maxSpendable = await getMaxSpendable(chainId, transaction);
    const fees = transaction.fees as bigint;
    return maxSpendable.native - fees >= 0n ? maxSpendable.native - fees : 0n;
  }
}

async function getMaxSpendable(
  chainId: ChainId,
  transaction: TransactionData
): Promise<TransactionSpendableAmounts> {
  const ethBalance = await fetchBalance(chainId, transaction.senderAddress as EvmAddress);

  if (transaction.mode === TransactionMode.TRANSFER_TOKEN) {
    try {
      const erc20Balance = await fetchERC20Balance({
        chainId,
        contractAddress: transaction.tokenId as EvmAddress,
        senderAddress: transaction.senderAddress as EvmAddress,
      });
      return {
        native: ethBalance,
        token: erc20Balance,
      };
    } catch (e) {
      // An error from Viem here likely just means the address doesn't hold the token
      if (!(e instanceof ViemError)) {
        throw e;
      }
    }
  }

  return { native: ethBalance };
}

// For each unique contract address in the list of events,
// store one arbitray event that's linked to that contract address.
// Since events contain token info, this allows to build the list of tokens linked to an address
function getOneEventPerContractAddress(events: EtherscanERC20Event[]): Map<EvmAddress, EtherscanERC20Event> {
  const eventPerContractAddress = new Map<EvmAddress, any>();
  for (const event of events) {
    if (!eventPerContractAddress.has(event.contractAddress)) {
      eventPerContractAddress.set(event.contractAddress, event);
    }
  }
  return eventPerContractAddress;
}

async function buildStakewiseData(
  chainId: ChainId,
  transactionData: StakeTransactionData
): Promise<HexString> {
  const harvestParams = await getHarvestParams(chainId, transactionData.targetValidatorAddress);

  if (harvestParams.canHarvest) {
    return encodeFunctionData({
      abi: stakewiseVaultDefaultABI,
      functionName: "updateStateAndDeposit",
      args: [
        transactionData.senderAddress as EvmAddress,
        transactionData.targetValidatorAddress as EvmAddress,
        harvestParams.params as DeepHexPrefixedValues<typeof harvestParams.params>,
      ],
    });
  } else {
    return encodeFunctionData({
      abi: stakewiseVaultDefaultABI,
      functionName: "deposit",
      args: [
        transactionData.senderAddress as EvmAddress,
        transactionData.targetValidatorAddress as EvmAddress,
      ],
    });
  }
}

export {
  buildStakewiseData,
  getMaxSpendable,
  getOneEventPerContractAddress,
  getTransactionAmount,
  getTransactionFees,
  getTransactionGas,
  isHexString,
};
export type { DeepHexPrefixedValues };
