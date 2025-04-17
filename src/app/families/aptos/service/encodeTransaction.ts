import { Status, Transaction } from "~/app/model/types_WIP";
import { AptosService } from "../service";

async function encodeTransactionToSign(
  this: AptosService,
  _: {
    transaction: Transaction;
    status: Status;
  }
): Promise<void> {}

async function encodeTransactionToBroadcast(
  this: AptosService,
  _: {
    signedTransaction: Transaction;
    status: Status;
  }
): Promise<string> {
  return "0x";
}

export { encodeTransactionToBroadcast, encodeTransactionToSign };
