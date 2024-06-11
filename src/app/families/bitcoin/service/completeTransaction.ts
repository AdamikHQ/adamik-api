import { PlainTransaction, TransactionMode } from "~/app/model/types_WIP";
import { BtcService } from ".";

async function completeTransaction(
  this: BtcService,
  transaction: PlainTransaction
): Promise<PlainTransaction> {
  throw new Error("Not implemented");
}

export { completeTransaction };
