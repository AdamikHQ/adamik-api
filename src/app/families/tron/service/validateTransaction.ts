import { Transaction } from "~/app/model/types_WIP";
import { TronService } from ".";

async function prevalidateTransaction(this: TronService, transaction: Transaction): Promise<void> {
  throw new Error("Not implemented prevalidateTransaction");
}

async function validateTransaction(this: TronService, transaction: Transaction): Promise<void> {
  // TODO
}

export { prevalidateTransaction, validateTransaction };
