import { FinalizedTransaction } from "~/app/model/types_WIP";
import { TronService } from ".";

async function getTransaction(
  this: TronService,
  transactionId: string
): Promise<FinalizedTransaction | null> {
  throw new Error("TRON : Not implemented encodeTransactionToSign");
}

export { getTransaction };
