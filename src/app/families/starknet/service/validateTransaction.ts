import { Status, Transaction } from "~/app/model/types_WIP";
import { StarknetService } from "../service";

async function prevalidateTransaction(
  this: StarknetService,
  _: {
    transaction: Transaction;
    status: Status;
  }
): Promise<void> {}

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
