import { BaseError as ViemError } from "viem";
import { CHAINS } from "~/app/config/chains";
import {
  ChainId,
  PlainTransaction,
  TransactionMode,
  TransactionSpendableAmounts,
} from "~/app/model/types_WIP";
import { EvmAddress, EvmChainParams } from "./types";
import {
  estimateERC20FeesForL2,
  estimateERC20Gas,
  estimateFeesForL2,
  estimateFeesPerGas,
  estimateGas,
  getBalance,
  getERC20Balance,
} from "./backend/node";
import { EtherscanERC20Event } from "./backend/types";

async function getTransactionGas(chainId: ChainId, transaction: PlainTransaction): Promise<bigint> {
  if (transaction.mode === TransactionMode.TRANSFER_TOKEN) {
    return await estimateERC20Gas({
      chainId,
      contractAddress: transaction.tokenId as EvmAddress,
      senderAddress: transaction.senders[0] as EvmAddress,
      recipientAddress: transaction.recipients[0] as EvmAddress,
      amount: transaction.amount,
    });
  } else {
    return await estimateGas({
      chainId,
      senderAddress: transaction.senders[0] as EvmAddress,
      recipientAddress: transaction.recipients[0] as EvmAddress,
      amount: transaction.amount,
    });
  }
}

async function getTransactionFees(chainId: ChainId, transaction: PlainTransaction): Promise<bigint> {
  const chainParams = CHAINS[chainId].params as EvmChainParams;

  if (chainParams?.isL2Fees) {
    return transaction.mode === TransactionMode.TRANSFER_TOKEN
      ? await estimateERC20FeesForL2({
          chainId,
          contractAddress: transaction.tokenId as EvmAddress,
          senderAddress: transaction.senders[0] as EvmAddress,
          recipientAddress: transaction.recipients[0] as EvmAddress,
          amount: transaction.amount,
        })
      : await estimateFeesForL2({
          chainId,
          senderAddress: transaction.senders[0] as EvmAddress,
          recipientAddress: transaction.recipients[0] as EvmAddress,
          amount: transaction.amount,
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

async function getTransactionAmount(chainId: ChainId, transaction: PlainTransaction): Promise<bigint> {
  if (!transaction.useMaxAmount) {
    return transaction.amount;
  }

  if (transaction.mode === TransactionMode.TRANSFER_TOKEN) {
    const maxSpendable = await getMaxSpendable(chainId, transaction);
    return maxSpendable.token!;
  } else {
    const maxSpendable = await getMaxSpendable(chainId, transaction);
    return maxSpendable.native - transaction.fees >= 0n ? maxSpendable.native - transaction.fees : 0n;
  }
}

async function getMaxSpendable(
  chainId: ChainId,
  transaction: PlainTransaction
): Promise<TransactionSpendableAmounts> {
  const ethBalance = await getBalance(chainId, transaction.senders[0] as EvmAddress);

  if (transaction.mode === TransactionMode.TRANSFER_TOKEN) {
    try {
      const erc20Balance = await getERC20Balance({
        chainId,
        contractAddress: transaction.tokenId as EvmAddress,
        senderAddress: transaction.senders[0] as EvmAddress,
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
  getTransactionGas,
  getTransactionFees,
  getTransactionAmount,
  getMaxSpendable,
  getOneEventPerContractAddress,
};
