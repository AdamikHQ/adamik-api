import { Status, Transaction } from "~/app/model/types_WIP";

export async function validateTransaction(_: { transaction: Transaction; status: Status }): Promise<Status> {
  // Basic validation is done in encodeTransactionToSign
  return {
    errors: [],
    warnings: [],
  };
}

export async function prevalidateTransaction({
  transaction,
  status,
}: {
  transaction: Transaction;
  status: Status;
}): Promise<void> {
  await validateTransaction({ transaction, status });
}
