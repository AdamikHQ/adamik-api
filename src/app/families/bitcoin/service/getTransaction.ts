import { PastTransaction, TransactionMode, TransactionState } from "~/app/model/types_WIP";
import { BitcoinService } from ".";
import { fetchTransaction } from "../backend/explorer";

async function getTransaction(this: BitcoinService, transactionId: string): Promise<PastTransaction | null> {
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
  const explorerTransaction: PastTransaction = {
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
    explorerTransaction.state = TransactionState.CONFIRMED;
    explorerTransaction.timestamp = new Date(transactionData.transaction.time).getTime();
    explorerTransaction.blockHeight = BigInt(transactionData.transaction.block_id);
  }

  if (transactionData.inputs.length) {
    for (const input of transactionData.inputs) {
      explorerTransaction.senders.push({ address: input.recipient });
    }
  }

  if (transactionData.outputs.length) {
    for (const output of transactionData.outputs)
      explorerTransaction.recipients.push({
        address: output.recipient,
        amount: output.value,
      });
  }

  return explorerTransaction;
}

export { getTransaction };
