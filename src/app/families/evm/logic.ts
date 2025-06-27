import { Abi, Hex, BaseError as ViemError } from "viem";
import { CHAINS } from "~/app/config/chains";
import {
  ChainId,
  TransactionData,
  TransactionMode,
  TransactionSpendableAmounts,
} from "~/app/model/types_WIP";
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
import { EvmAddress, EvmChainParams } from "./types";

const isHexString = (val: string): val is Hex =>
  val?.startsWith && val.startsWith("0x") && /^[0-9a-fA-F]+$/i.test(val.slice(2));

async function getTransactionGas(chainId: ChainId, transaction: TransactionData): Promise<bigint> {
  switch (transaction.mode) {
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
      const baseParams = [transaction.senderAddress, transaction.targetValidatorAddress];
      const updateStateParams = [
        transaction.senderAddress,
        transaction.targetValidatorAddress,
        harvestParams.params,
      ];

      let gas = 0n;

      if (harvestParams.canHarvest) {
        gas = await estimateContractGas(
          chainId,
          transaction.targetValidatorAddress as EvmAddress,
          stakewiseVaultDefaultABI,
          "updateStateAndDeposit",
          updateStateParams,
          transaction.amount
        );
      } else {
        gas = await estimateContractGas(
          chainId,
          transaction.targetValidatorAddress as EvmAddress,
          stakewiseVaultDefaultABI as Abi,
          "deposit",
          baseParams,
          transaction.amount
        );
      }

      return gas;
    default:
      return await estimateGas({
        chainId,
        senderAddress: transaction.senderAddress as EvmAddress,
        recipientAddress: transaction.recipientAddress as EvmAddress,
        amount: transaction.amount ?? 0n,
      });
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

export {
  getMaxSpendable,
  getOneEventPerContractAddress,
  getTransactionAmount,
  getTransactionFees,
  getTransactionGas,
  isHexString,
};
