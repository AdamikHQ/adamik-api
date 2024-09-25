import { Transaction } from "~/app/model/types_WIP";
import { TronService } from ".";

async function encodeTransactionToSign(this: TronService, transaction: Transaction): Promise<void> {
  throw new Error("TRON : Not implemented encodeTransactionToSign");
}

async function encodeTransactionToBroadcast(
  this: TronService,
  signedTransaction: Transaction
): Promise<string> {
  throw new Error("TRON : Not implemented encodeTransactionToBroadcast");
}

export { encodeTransactionToBroadcast, encodeTransactionToSign };
