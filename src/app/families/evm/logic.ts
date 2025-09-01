import { decodeEventLog, decodeFunctionData, encodeFunctionData, Hex, BaseError as ViemError } from "viem";
import { CHAINS } from "~/app/config/chains";
import {
  ChainId,
  FinalizedTransaction,
  StakeTransactionData,
  TransactionData,
  TransactionMode,
  TransactionSpendableAmounts,
  UnstakeTransactionData,
  WithdrawTransactionData,
} from "~/app/model/types_WIP";
import { AdamikApiServerError, UserInputError } from "~/app/tools/handlers/errors";
import { stakewiseVaultDefaultABI } from "./abi/StakewiseVaultDefaultABI";
import { AlchemyTransactionWithReceipt } from "./backend/alchemy.types";
import { MoralisTransaction } from "./backend/moralis.types";
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
import { ExitedAssetsClaimed, ExitQueueEnteredEvent } from "./backend/stakewise.types";
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
      const args = await buildStakewiseUnstakeData(chainId, transactionData);
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
      const args = await buildStakewiseWithdrawData(chainId, transactionData);
      return await estimateContractGas({
        chainId,
        contractAddress: transactionData.validatorAddress as EvmAddress,
        accountAddress: transactionData.senderAddress as EvmAddress,
        abi: stakewiseVaultDefaultABI,
        functionName: "claimExitedAssets",
        args,
        value: 0n,
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

  const maxSpendable = await getMaxSpendable(chainId, transaction);

  if (transaction.mode === TransactionMode.TRANSFER_TOKEN) {
    return maxSpendable.token!;
  } else {
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

// STAKEWISE ////////////////////////////////////////////////////////////////////

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
    console.warn(
      `/!\\ [StakeWise] No staking position found for sender address ${transactionData.senderAddress} and validator address ${vaultAddress}`
    );
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

async function getAmountFromExitPosition(
  chainId: ChainId,
  senderAddress: string,
  vaultAddress: string,
  positionTicket: string
): Promise<bigint> {
  const stakingData = await fetchStakingData(chainId, senderAddress);

  const allocatorData = stakingData.find((data) => data.vault.id === vaultAddress);
  if (!allocatorData) {
    console.warn(
      `/!\\ [StakeWise] No staking position found for sender address ${senderAddress} and validator address ${vaultAddress}`
    );
    throw new AdamikApiServerError(`No locked staking position found for validator address ${vaultAddress}`);
  }

  const exitRequest = allocatorData.exitRequests.find((request) => request.positionTicket === positionTicket);
  if (!exitRequest) {
    throw new AdamikApiServerError(`No exit request found for position ticket ${positionTicket}`);
  }

  return BigInt(exitRequest.totalAssets);
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
  chainId: ChainId,
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
  chainId: ChainId,
  transactionData: WithdrawTransactionData
): Promise<[bigint, bigint, bigint]> {
  // Get position ticket from stakeId
  const { stakingTimestamp } = transactionData.params as EvmTransactionParams;
  if (!stakingTimestamp) {
    console.warn("/!\\ Missing stakingTimestamp in transaction params");
    throw new AdamikApiServerError("Error while building staking transaction");
  }

  const positionTicket = transactionData.stakeId?.split("-")[1];
  if (!positionTicket) {
    console.warn("/!\\ Invalid stakeId in transaction:", transactionData);
    throw new UserInputError("Invalid stakeId");
  }

  const stakingData = await fetchStakingData(chainId, transactionData.senderAddress);

  const exitRequest = stakingData
    .find((data) => data.vault.id === transactionData.validatorAddress)
    ?.exitRequests.find((request) => request.id === transactionData.stakeId);
  if (!exitRequest) {
    console.warn("/!\\ Invalid stakeId in transaction:", transactionData);
    throw new AdamikApiServerError(`No staking position found for stakeId ${transactionData.stakeId}`);
  }
  if (!exitRequest.exitQueueIndex) {
    throw new UserInputError(`Unlocking period is not over yet for stakeId ${transactionData.stakeId}`);
  }

  return [BigInt(positionTicket), stakingTimestamp, BigInt(exitRequest.exitQueueIndex)];
}

// NOTE This function will throw if the provided explorer transaction,
// isn't a stakewise one, so callers should try/catch this function
async function parseStakewiseTransaction(
  chainId: ChainId,
  explorerTransaction: MoralisTransaction | AlchemyTransactionWithReceipt,
  parsedTransaction: NonNullable<FinalizedTransaction["parsed"]>
) {
  const stakewiseDecodedCall = decodeFunctionData({
    abi: stakewiseVaultDefaultABI,
    data: explorerTransaction.input as HexString,
  });

  const mainLog =
    "logs" in explorerTransaction ? explorerTransaction.logs[0] : explorerTransaction.receipt.logs[0];
  const topics =
    "topics" in mainLog ? mainLog.topics : [mainLog.topic0, mainLog.topic1, mainLog.topic2, mainLog.topic3];

  const stakewiseDecodedEvent = decodeEventLog({
    abi: stakewiseVaultDefaultABI,
    data: mainLog.data,
    // @ts-ignore ???
    topics,
  });

  const fromAddress =
    "from" in explorerTransaction ? explorerTransaction.from : explorerTransaction.from_address;
  const toAddress = "to" in explorerTransaction ? explorerTransaction.to : explorerTransaction.to_address;

  switch (stakewiseDecodedCall.functionName) {
    case "deposit":
    case "updateStateAndDeposit": {
      parsedTransaction.mode = TransactionMode.STAKE;

      parsedTransaction.senders = [
        {
          address: fromAddress,
          amount: BigInt(explorerTransaction.value),
        },
      ];

      parsedTransaction.validators = {
        target: {
          address: toAddress,
          amount: BigInt(explorerTransaction.value),
        },
      };

      break;
    }
    case "enterExitQueue": {
      parsedTransaction.mode = TransactionMode.UNSTAKE;

      const amount = await getAmountFromExitPosition(
        chainId,
        fromAddress,
        toAddress,
        (stakewiseDecodedEvent.args as ExitQueueEnteredEvent).positionTicket.toString()
      );

      parsedTransaction.senders = [
        {
          address: fromAddress,
          amount: 0n, // 0 because staker's balance doesn't change
        },
      ];

      parsedTransaction.validators = {
        target: {
          address: toAddress,
          amount,
        },
      };

      break;
    }
    case "claimExitedAssets": {
      parsedTransaction.mode = TransactionMode.WITHDRAW;

      const amount = (stakewiseDecodedEvent.args as ExitedAssetsClaimed).withdrawnAssets;
      parsedTransaction.senders = [
        {
          address: fromAddress,
          amount,
        },
      ];

      parsedTransaction.validators = {
        source: {
          address: toAddress,
          amount,
        },
      };

      break;
    }
    default: {
      parsedTransaction.mode = "unknown";

      parsedTransaction.senders = [
        {
          address: fromAddress,
          amount: BigInt(explorerTransaction.value),
        },
      ];

      parsedTransaction.recipients = [
        {
          address: toAddress,
          amount: BigInt(explorerTransaction.value),
        },
      ];
    }
  }

  return {
    parsed: parsedTransaction,
    raw: explorerTransaction,
  };
}

export {
  buildStakewiseUnstakeData,
  buildStakewiseWithdrawData,
  encodeStakewiseStakeData,
  getAmountFromExitPosition,
  getMaxSpendable,
  getTransactionAmount,
  getTransactionFees,
  getTransactionGas,
  isHexString,
  parseStakewiseTransaction,
  setHarvestParams,
  setSharesFromAmount,
  setStakingPositionTimestamp,
};
export type { DeepHexPrefixedValues };
