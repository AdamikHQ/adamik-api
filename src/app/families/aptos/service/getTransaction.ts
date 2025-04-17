import { FinalizedTransaction, TransactionMode, TransactionState } from "~/app/model/types_WIP";
import { fetchTransactionByHash } from "~/app/families/aptos/backend/node";
import { AptosService } from "~/app/families/aptos/service";
import { TransactionIdNotFoundError } from "~/app/tools/handlers/errors";

export async function getTransaction(this: AptosService, txId: string): Promise<FinalizedTransaction> {
  const tx = await fetchTransactionByHash(this.chainId, txId);
  if (tx === null) {
    throw new TransactionIdNotFoundError(txId, this.chainId);
  }

  return {
    parsed: {
      id: tx.hash,
      mode: TransactionMode.TRANSFER,
      state: TransactionState.CONFIRMED,
      blockHeight: BigInt(tx.version),
      timestamp: Number(tx.timestamp),
      fees: {
        amount: BigInt(tx.gas_used),
        ticker: "APT",
      },
      gas: BigInt(tx.gas_used),
      senders: [
        {
          address: tx.sender,
          amount: BigInt(tx.payload.arguments[1]),
          ticker: "APT",
        },
      ],
      recipients: [
        {
          address: tx.payload.arguments[0],
          amount: BigInt(tx.payload.arguments[1]),
          ticker: "APT",
        },
      ],
    },
    raw: tx,
  };
}
