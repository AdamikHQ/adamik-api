import { CHAINS } from "~/app/config/chains";
import {
  ChainId,
  PlainTransaction,
  TransactionMode,
  TransactionSpendableAmounts,
} from "~/app/model/types_WIP";
import { EvmAddress, EvmParams } from "./types";
import {
  estimateERC20FeesForL2,
  estimateERC20Gas,
  estimateFeesForL2,
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

async function getTransactionFees(
  chainId: ChainId,
  transaction: PlainTransaction,
  maxFeePerGas: bigint
): Promise<bigint> {
  if (!transaction.gas) {
    throw new Error("Missing gas from transaction to compute fees");
  }

  const chainParams = CHAINS[chainId].params as EvmParams;

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
    const erc20Balance = await getERC20Balance({
      chainId,
      contractAddress: transaction.tokenId as EvmAddress,
      senderAddress: transaction.senders[0] as EvmAddress,
    });
    return {
      native: ethBalance,
      token: erc20Balance,
    };
  } else {
    return { native: ethBalance };
  }
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
