import { CHAINS } from "~/app/config/chains";
import { FinalizedTransaction, TransactionMode, TransactionState } from "~/app/model/types_WIP";
import { TransactionIdNotFoundError } from "~/app/tools/handlers/errors";
import { fetchStats, fetchTransaction } from "../backend/blockchair";
import { BitcoinService } from "../service";
import { BitcoinChainParams } from "../types";

async function getTransaction(this: BitcoinService, transactionId: string): Promise<FinalizedTransaction> {
  const bitcoinTransaction = await fetchTransaction(this.chainId, transactionId);

  if (!bitcoinTransaction?.data || Array.isArray(bitcoinTransaction.data)) {
    throw new TransactionIdNotFoundError(transactionId, this.chainId);
  }

  const transactionData = bitcoinTransaction.data[transactionId];
  const parsedTransaction: FinalizedTransaction["parsed"] = {
    id: transactionId,
    mode: TransactionMode.TRANSFER,
    fees: {
      amount: transactionData.transaction.fee,
    },
    // Placeholder values, actual values filled below
    state: TransactionState.PENDING,
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

    // NOTE Blockchair returns transaction time in a bad format, e.g: "2024-09-10 11:05:14"
    // instead of a timestamp or a proper ISO string: "2024-09-10T11:05:14.000Z"
    // This format is ambiguous about the timezone, so we have to append 'UTC' for Date to handle it correctly...
    parsedTransaction.timestamp = new Date(transactionData.transaction.time + " UTC").getTime();
    parsedTransaction.blockHeight = BigInt(transactionData.transaction.block_id);
  }

  if (transactionData.inputs.length) {
    parsedTransaction.senders = [];
    for (const input of transactionData.inputs) {
      parsedTransaction.senders.push({
        address: input.recipient,
        amount: input.value,
      });
    }
  }

  if (transactionData.outputs.length) {
    for (const output of transactionData.outputs)
      parsedTransaction.recipients!.push({
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
