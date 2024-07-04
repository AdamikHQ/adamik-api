import { Transaction, TransactionWrapper } from "~/app/model/types_WIP";
import { BtcService } from ".";

async function completeTransaction(
  this: BtcService,
  transaction: TransactionWrapper
): Promise<void> {
  throw new Error("Not implemented");
}

export { completeTransaction };
