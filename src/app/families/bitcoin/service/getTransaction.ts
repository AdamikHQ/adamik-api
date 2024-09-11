import { CHAINS } from "~/app/config/chains";
import { FinalizedTransaction, TransactionMode, TransactionState } from "~/app/model/types_WIP";
import { BitcoinService } from ".";
import { fetchStats, fetchTransaction } from "../backend/explorer";
import { BitcoinChainParams } from "../types";

async function getTransaction(
  this: BitcoinService,
  transactionId: string
): Promise<FinalizedTransaction | null> {
  let bitcoinTransaction;
  try {
    bitcoinTransaction = await fetchTransaction(this.chainId, transactionId);
  } catch (e) {
    return null;
  }

  if (!bitcoinTransaction.data || Array.isArray(bitcoinTransaction.data)) {
    return null;
  }

  const transactionData = bitcoinTransaction.data[transactionId];
  const parsedTransaction: FinalizedTransaction["parsed"] = {
    chainId: this.chainId,
    id: transactionId,
    mode: TransactionMode.TRANSFER,
    fees: transactionData.transaction.fee,
    // Placeholder values, actual values filled below
    state: TransactionState.PENDING,
    senders: [],
    recipients: [],
  };

  const bitcoinParams = CHAINS[this.chainId].params as BitcoinChainParams;

  const blockHeight = transactionData.transaction.block_id;
  if (blockHeight !== undefined && blockHeight !== -1) {
    const { blocks: latestBlock } = await fetchStats(this.chainId);
    const isTransactionConfirmed = latestBlock - blockHeight >= bitcoinParams.confirmations;

    parsedTransaction.state = isTransactionConfirmed
      ? TransactionState.CONFIRMED
      : TransactionState.UNCONFIRMED;
    parsedTransaction.timestamp = new Date(transactionData.transaction.time).getTime();
    parsedTransaction.blockHeight = BigInt(transactionData.transaction.block_id);
  }

  if (transactionData.inputs.length) {
    for (const input of transactionData.inputs) {
      parsedTransaction.senders.push({ address: input.recipient });
    }
  }

  if (transactionData.outputs.length) {
    for (const output of transactionData.outputs)
      parsedTransaction.recipients?.push({
        address: output.recipient,
        amount: output.value,
      });
  }

  return {
    parsed: parsedTransaction,
    raw: transactionData,
  };
}

export { getTransaction };
