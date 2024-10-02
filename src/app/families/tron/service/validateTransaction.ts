import { Transaction, TransactionMode } from "~/app/model/types_WIP";
import { TronService } from ".";
import { prevalidateTransactionCommon } from "../../common";
import { getAccount, isValidAddress } from "../backend/node";

async function prevalidateTransaction(this: TronService, transaction: Transaction): Promise<void> {
  transaction.status = await prevalidateTransactionCommon(transaction.data, async (address: string) =>
    isValidAddress(address)
  );
}

async function validateTransaction(this: TronService, transaction: Transaction): Promise<void> {
  const transactionData = transaction.data;
  const availableBalance = (await getAccount(transactionData.sender)).balance;
  const amount = transactionData.amount as bigint;
  const fees = transactionData.fees as bigint;

  switch (transactionData.mode) {
    case TransactionMode.TRANSFER:
      // - amount + fees < nativeBalance
      if (availableBalance && amount + fees > BigInt(availableBalance)) {
        transaction.status.errors.push({ message: "Balance is too low" });
      }

      break;
  }

  // - fees < nativeBalance
  if (availableBalance && fees > BigInt(availableBalance)) {
    transaction.status.errors.push({ message: "Balance is too low to cover the fees" });
  }

  if (amount < fees * 10n) {
    transaction.status.warnings.push({ message: "Network fees are above 10% of the amount" });
  }
}

export { prevalidateTransaction, validateTransaction };
