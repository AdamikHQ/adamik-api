import { PlainTransaction, Transaction } from "~/app/model/types_WIP";
import { BtcService } from ".";

async function encodeTransactionToSign(this: BtcService, transaction: PlainTransaction): Promise<string> {
  throw new Error("Not implemented");
}

async function encodeTransactionToBroadcast(
  this: BtcService,
  signedTransaction: Transaction
): Promise<string> {
  throw new Error("Not implemented");
}

export { encodeTransactionToSign, encodeTransactionToBroadcast };
