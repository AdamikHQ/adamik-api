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

  const parsedTransaction: FinalizedTransaction["parsed"] = {
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
    parsedTransaction.state = TransactionState.CONFIRMED;
    parsedTransaction.timestamp = algoTransaction.roundTime;
    parsedTransaction.blockHeight = BigInt(algoTransaction.confirmedRound);
  }

  if (algoTransaction.txType === "pay") {
    parsedTransaction.mode = TransactionMode.TRANSFER;
    parsedTransaction.recipients = [
      {
        address: algoTransaction.paymentTransaction.receiver,
        amount: algoTransaction.paymentTransaction.amount,
      },
    ];
  } else if (algoTransaction.txType === "axfer") {
    parsedTransaction.mode = TransactionMode.TRANSFER_TOKEN;
    parsedTransaction.tokenId = algoTransaction.assetTransferTransaction.assetId.toString();
    parsedTransaction.recipients = [
      {
        address: algoTransaction.assetTransferTransaction.receiver,
        amount: algoTransaction.assetTransferTransaction.amount,
      },
    ];
  } else {
    // Not supported (yet?)
    console.warn(`/!\\ Unsupported parsing of transaction ${transactionId} for chainId ${this.chainId}`);
    return {
      raw: algoTransaction,
    };
  }

  if (algoTransaction.note !== undefined) {
    parsedTransaction.memo = atob(algoTransaction.note); // Algorand notes are provided as Base64 strings
  }

  return {
    parsed: parsedTransaction,
    raw: algoTransaction,
  };
}

export { getTransaction };
