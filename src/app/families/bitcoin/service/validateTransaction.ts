import { PlainTransaction, Transaction, TransactionStatus } from "~/app/model/types_WIP";
import { BtcService } from ".";

// FIXME Same implem as cosmos... something to make generic?
async function validateTransactionIntent(
  this: BtcService,
  transaction: PlainTransaction
): Promise<void> {
  throw new Error("Not implemented");
}

// FIXME Should useMaxAmount be considered in this function?... or just the amount, whatever it is?
async function validateTransaction(
  this: BtcService,
  transaction: Transaction
): Promise<void> {
  throw new Error("Not implemented");
}

export { validateTransaction, validateTransactionIntent };

