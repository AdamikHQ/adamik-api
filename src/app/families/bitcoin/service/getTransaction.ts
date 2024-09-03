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
    console.warn(`/!\\ Unsupported ${this.chainId} transaction with transactionId ${transactionId}`);
    return null;
  }

  if (!bitcoinTransaction.data || Array.isArray(bitcoinTransaction.data)) {
    console.warn(`/!\\ Unsupported ${this.chainId} transaction with transactionId ${transactionId}`);
    return null;
  }

  const transactionData = bitcoinTransaction.data[transactionId];
  const finalizedTransaction: FinalizedTransaction = {
    chainId: this.chainId,
    id: transactionId,
    mode: TransactionMode.TRANSFER,
    fees: transactionData.transaction.fee,
    // Placeholder values, actual values filled below
    state: TransactionState.PENDING,
    senders: [],
    recipients: [],
  };

  if (transactionData.transaction.block_id !== undefined) {
    finalizedTransaction.state = TransactionState.CONFIRMED;
    finalizedTransaction.timestamp = new Date(transactionData.transaction.time).getTime();
    finalizedTransaction.blockHeight = BigInt(transactionData.transaction.block_id);
  }

  if (transactionData.inputs.length) {
    for (const input of transactionData.inputs) {
      finalizedTransaction.senders.push({ address: input.recipient });
    }
  }

  if (transactionData.outputs.length) {
    for (const output of transactionData.outputs)
      finalizedTransaction.recipients.push({
        address: output.recipient,
        amount: output.value,
      });
  }

  return finalizedTransaction;
}

export { getTransaction };
