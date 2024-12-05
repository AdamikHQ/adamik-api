import { Status, Transaction } from "~/app/model/types_WIP";
import { StarknetService } from "../service";

async function encodeTransactionToSign(
  this: StarknetService,
  _: {
    transaction: Transaction;
    status: Status;
  }
): Promise<void> {
  throw new Error("Not implemented");
}

async function encodeTransactionToBroadcast(
  this: StarknetService,
  _: {
    signedTransaction: Transaction;
    status: Status;
  }
): Promise<string> {
  throw new Error("Not implemented");
}

export { encodeTransactionToBroadcast, encodeTransactionToSign };
