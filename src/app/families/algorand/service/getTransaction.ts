import { PastTransaction, TransactionMode, TransactionState } from "~/app/model/types_WIP";
import { AlgorandService } from ".";
import { fetchTransaction } from "../backend/explorer";

async function getTransaction(this: AlgorandService, transactionId: string): Promise<PastTransaction | null> {
  const algoTransaction = await fetchTransaction(transactionId);
  if (!algoTransaction) {
    return null;
  }

  const explorerTransaction: PastTransaction = {
    chainId: this.chainId,
    id: transactionId,
    senders: [{ address: algoTransaction.sender }],
    fees: algoTransaction.fee,
    // Placeholder values, actual values filled below
    state: TransactionState.UNCONFIRMED,
    mode: TransactionMode.TRANSFER,
    recipients: [],
  };

  if ("confirmedRound" in algoTransaction) {
    explorerTransaction.state = TransactionState.CONFIRMED;
    explorerTransaction.timestamp = algoTransaction.roundTime;
    explorerTransaction.blockHeight = BigInt(algoTransaction.confirmedRound);
  }

  if (algoTransaction.txType === "pay") {
    explorerTransaction.mode = TransactionMode.TRANSFER;
    explorerTransaction.recipients = [
      {
        address: algoTransaction.paymentTransaction.receiver,
        amount: algoTransaction.paymentTransaction.amount,
      },
    ];
  } else if (algoTransaction.txType === "axfer") {
    explorerTransaction.mode = TransactionMode.TRANSFER_TOKEN;
    explorerTransaction.tokenId = algoTransaction.assetTransferTransaction.assetId.toString();
    explorerTransaction.recipients = [
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
    explorerTransaction.memo = atob(algoTransaction.note); // Algorand notes are provided as Base64 strings
  }

  return explorerTransaction;
}

export { getTransaction };
