import { encodeFunctionData, Hex, BaseError as ViemError } from "viem";
import { CHAINS } from "~/app/config/chains";
import {
  ChainId,
  StakeTransactionData,
  TransactionData,
  TransactionMode,
  TransactionSpendableAmounts,
  UnstakeTransactionData,
  WithdrawTransactionData,
} from "~/app/model/types_WIP";
import { AdamikApiServerError, UserInputError } from "~/app/tools/handlers/errors";
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
import { fetchHarvestParams, fetchStakingData } from "./backend/stakewise";
import { EtherscanERC20Event } from "./backend/types";
import { EvmAddress, EvmChainParams, EvmTransactionParams, HexString } from "./types";

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

async function getTransactionGas(chainId: ChainId, transactionData: TransactionData): Promise<bigint> {
  switch (transactionData.mode) {
    case TransactionMode.TRANSFER: {
      return await estimateGas({
        chainId,
        senderAddress: transactionData.senderAddress as EvmAddress,
        recipientAddress: transactionData.recipientAddress as EvmAddress,
        amount: transactionData.amount ?? 0n,
      });
    }

    case TransactionMode.TRANSFER_TOKEN: {
      return await estimateERC20Gas({
        chainId,
        contractAddress: transactionData.tokenId as EvmAddress,
        senderAddress: transactionData.senderAddress as EvmAddress,
        recipientAddress: transactionData.recipientAddress as EvmAddress,
        amount: transactionData.amount ?? 0n,
      });
    }

    case TransactionMode.STAKE: {
      const { stakingHarvestParams } = transactionData.params as EvmTransactionParams;
      if (!stakingHarvestParams) {
        console.warn("/!\\ Missing stakingHarvestParams in transaction params");
        throw new AdamikApiServerError("Error while building staking transaction");
      }

      return stakingHarvestParams?.canHarvest
        ? await estimateContractGas({
            chainId,
            contractAddress: transactionData.targetValidatorAddress as EvmAddress,
            accountAddress: transactionData.senderAddress as EvmAddress,
            abi: stakewiseVaultDefaultABI,
            functionName: "updateStateAndDeposit",
            args: [
              transactionData.senderAddress,
              transactionData.targetValidatorAddress,
              stakingHarvestParams?.params,
            ],
            value: transactionData.amount,
          })
        : await estimateContractGas({
            chainId,
            contractAddress: transactionData.targetValidatorAddress as EvmAddress,
            accountAddress: transactionData.senderAddress as EvmAddress,
            abi: stakewiseVaultDefaultABI,
            functionName: "deposit",
            args: [transactionData.senderAddress, transactionData.targetValidatorAddress],
            value: transactionData.amount,
          });
    }

    case TransactionMode.UNSTAKE: {
      const args = await buildStakewiseUnstakeData(transactionData);
      return await estimateContractGas({
        chainId,
        contractAddress: transactionData.validatorAddress as EvmAddress,
        accountAddress: transactionData.senderAddress as EvmAddress,
        abi: stakewiseVaultDefaultABI,
        functionName: "enterExitQueue",
        args,
        value: 0n,
      });
    }

    case TransactionMode.WITHDRAW: {
      const args = await buildStakewiseWithdrawData(transactionData);
      return await estimateContractGas({
        chainId,
        contractAddress: transactionData.validatorAddress as EvmAddress,
        accountAddress: transactionData.senderAddress as EvmAddress,
        abi: stakewiseVaultDefaultABI,
        functionName: "claimExitedAssets",
        args,
        //value: 0n,
      });
    }

    default:
      throw new UserInputError(`Unsupported transaction mode ${transactionData.mode}`);
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

// Only when staking, we need to fetch "harvest params" from the vault
// The function sets the retrieved harvest params in transaction.data.params
async function setHarvestParams(chainId: ChainId, transactionData: StakeTransactionData): Promise<void> {
  const harvestParams = await fetchHarvestParams(chainId, transactionData.targetValidatorAddress);

  transactionData.params = {
    ...(transactionData.params as EvmTransactionParams),
    stakingHarvestParams: harvestParams,
  };
}

// Only when unstaking, we need to convert the amount to shares
// The function sets the computed shares in transaction.data.params
async function setSharesFromAmount(chainId: ChainId, transactionData: TransactionData): Promise<void> {
  // Fetch staking data for the vault
  const stakingData = await fetchStakingData(chainId, transactionData.senderAddress);

  // Get the validator address based on transaction mode
  const vaultAddress =
    transactionData.mode === TransactionMode.STAKE
      ? (transactionData as StakeTransactionData).targetValidatorAddress
      : (transactionData as UnstakeTransactionData).validatorAddress;

  // Use the first allocator data (there should typically be one per vault)
  const allocatorData = stakingData.find((allocator) => allocator.vault.id === vaultAddress);
  if (!allocatorData) {
    console.warn(`/!\\ [StakeWise] No staking position found for validator address ${vaultAddress}`);
    throw new UserInputError(`No locked staking position found for validator address ${vaultAddress}`);
  }

  const totalAssets = BigInt(allocatorData.assets);
  const totalShares = BigInt(allocatorData.shares);

  if (
    totalAssets === 0n ||
    totalShares === 0n ||
    (transactionData.amount && transactionData.amount > totalAssets)
  ) {
    throw new UserInputError("Staked balance is too low");
  }

  // Calculate shares using cross-multiplication
  const sharesAmount = transactionData.useMaxAmount
    ? totalShares
    : (transactionData.amount! * totalShares) / totalAssets;

  transactionData.params = {
    ...(transactionData.params as EvmTransactionParams),
    stakingShares: sharesAmount,
  };
}

// Only when withdrawing, we need the timestamp of the staking position to withdraw
// The function sets the retrieved timestamp in transaction.data.params
async function setStakingPositionTimestamp(
  chainId: ChainId,
  transactionData: WithdrawTransactionData
): Promise<void> {
  // Fetch staking data to get the timestamp
  const stakingData = await fetchStakingData(chainId, transactionData.senderAddress);

  // Find the exit request that matches our stakeId
  const timestamp = stakingData
    .flatMap((data) => data.exitRequests)
    .find((request) => request.id === transactionData.stakeId)?.timestamp;

  if (!timestamp) {
    console.warn(`/!\\ [StakeWise] Exit request not found for stakeId: ${transactionData.stakeId}`);
    throw new UserInputError(`No unlocked staking position found for stakeId: ${transactionData.stakeId}`);
  }

  transactionData.params = {
    ...(transactionData.params as EvmTransactionParams),
    stakingTimestamp: BigInt(timestamp),
  };
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

async function encodeStakewiseStakeData(
  chainId: ChainId,
  transactionData: StakeTransactionData
): Promise<HexString> {
  const { stakingHarvestParams } = transactionData.params as EvmTransactionParams;
  if (!stakingHarvestParams) {
    console.warn("/!\\ Missing stakingHarvestParams in transaction params");
    throw new AdamikApiServerError("Error while building staking transaction");
  }

  if (stakingHarvestParams.canHarvest) {
    return encodeFunctionData({
      abi: stakewiseVaultDefaultABI,
      functionName: "updateStateAndDeposit",
      args: [
        transactionData.senderAddress as EvmAddress,
        transactionData.targetValidatorAddress as EvmAddress,
        stakingHarvestParams.params as DeepHexPrefixedValues<typeof stakingHarvestParams.params>,
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

async function buildStakewiseUnstakeData(
  transactionData: UnstakeTransactionData
): Promise<[bigint, EvmAddress]> {
  const { stakingShares } = transactionData.params as EvmTransactionParams;
  if (!stakingShares) {
    console.warn("/!\\ Missing stakingShares in transaction params");
    throw new AdamikApiServerError("Error while building staking transaction");
  }

  return [
    stakingShares!,
    transactionData.senderAddress as EvmAddress, // Receiving address
  ];
}

async function buildStakewiseWithdrawData(
  transactionData: WithdrawTransactionData
): Promise<[bigint, bigint, bigint]> {
  // Get position ticket from stakeId
  const { stakingTimestamp } = transactionData.params as EvmTransactionParams;
  if (!stakingTimestamp) {
    console.warn("/!\\ Missing stakingTimestamp in transaction params");
    throw new AdamikApiServerError("Error while building staking transaction");
  }

  const positionTicket = transactionData.stakeId?.split("-")[1]!;
  if (!positionTicket || positionTicket.startsWith("0x")) {
    console.warn("/!\\ Invalid stakeId in transaction:", transactionData);
    throw new UserInputError("Invalid stakeId");
  }

  return [
    BigInt(positionTicket),
    stakingTimestamp,
    0n, // Only need a proper value if we want to support V1 positions
  ];
}

export {
  buildStakewiseUnstakeData,
  buildStakewiseWithdrawData,
  encodeStakewiseStakeData,
  getMaxSpendable,
  getOneEventPerContractAddress,
  getTransactionAmount,
  getTransactionFees,
  getTransactionGas,
  isHexString,
  setHarvestParams,
  setSharesFromAmount,
  setStakingPositionTimestamp,
};
export type { DeepHexPrefixedValues };
