import { FinalizedTransaction, TransactionMode, TransactionState } from "~/app/model/types_WIP";
import { BitcoinService } from ".";
import { fetchTransaction } from "../backend/explorer";

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

  if (transactionData.transaction.block_id !== undefined && transactionData.transaction.block_id !== -1) {
    parsedTransaction.state = TransactionState.CONFIRMED;
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
