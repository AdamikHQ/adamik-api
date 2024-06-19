import { Transaction } from "~/app/model/types_WIP";
import { BtcService } from ".";

async function completeTransaction(
  this: BtcService,
  transaction: Transaction
): Promise<void> {
  throw new Error("Not implemented");
}

export { completeTransaction };
