import { TransactionWrapper } from "~/app/model/types_WIP";
import { BtcService } from ".";

async function encodeTransactionToSign(this: BtcService, transaction: TransactionWrapper): Promise<void> {
  throw new Error("Not implemented");
}

async function encodeTransactionToBroadcast(
  this: BtcService,
  signedTransaction: TransactionWrapper
): Promise<string> {
  throw new Error("Not implemented");
}

export { encodeTransactionToBroadcast, encodeTransactionToSign };

