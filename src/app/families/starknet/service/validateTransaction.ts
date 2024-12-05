import { Status, Transaction } from "~/app/model/types_WIP";
import { StarknetService } from "../service";

async function prevalidateTransaction(
  this: StarknetService,
  _: {
    transaction: Transaction;
    status: Status;
  }
): Promise<void> {
  throw new Error("Not implemented");
}

async function validateTransaction(
  this: StarknetService,
  _: {
    transaction: Transaction;
    status: Status;
  }
): Promise<void> {
  // TODO
}

export { prevalidateTransaction, validateTransaction };
