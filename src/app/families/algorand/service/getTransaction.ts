import { FinalizedTransaction, TransactionMode, TransactionState } from "~/app/model/types_WIP";
import { AlgorandService } from ".";
import { fetchTransaction } from "../backend/explorer";

async function getTransaction(
  this: AlgorandService,
  transactionId: string
): Promise<FinalizedTransaction | null> {
  const algoTransaction = await fetchTransaction(transactionId);
  if (!algoTransaction) {
    return null;
  }

  const finalizedTransaction: FinalizedTransaction = {
    chainId: this.chainId,
    id: algoTransaction.id,
    senders: [{ address: algoTransaction.sender }],
    fees: algoTransaction.fee,
    // Placeholder values, actual values filled below
    state: TransactionState.UNCONFIRMED,
    mode: TransactionMode.TRANSFER,
    recipients: [],
  };

  if ("confirmedRound" in algoTransaction) {
    finalizedTransaction.state = TransactionState.CONFIRMED;
    finalizedTransaction.timestamp = algoTransaction.roundTime;
    finalizedTransaction.blockHeight = BigInt(algoTransaction.confirmedRound);
  }

  if (algoTransaction.txType === "pay") {
    finalizedTransaction.mode = TransactionMode.TRANSFER;
    finalizedTransaction.recipients = [
      {
        address: algoTransaction.paymentTransaction.receiver,
        amount: algoTransaction.paymentTransaction.amount,
      },
    ];
  } else if (algoTransaction.txType === "axfer") {
    finalizedTransaction.mode = TransactionMode.TRANSFER_TOKEN;
    finalizedTransaction.tokenId = algoTransaction.assetTransferTransaction.assetId.toString();
    finalizedTransaction.recipients = [
      {
        address: algoTransaction.assetTransferTransaction.receiver,
        amount: algoTransaction.assetTransferTransaction.amount,
      },
    ];
  } else {
    console.warn(`/!\\ Unsupported ${this.chainId} transaction with transactionId ${transactionId}`);
    return null;
  }

  if (algoTransaction.note !== undefined) {
    finalizedTransaction.memo = atob(algoTransaction.note); // Algorand notes are provided as Base64 strings
  }

  return finalizedTransaction;
}

export { getTransaction };
