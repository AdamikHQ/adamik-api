import { isAddress as isValidAddress } from "viem";
import { Transaction, TransactionMode } from "~/app/model/types_WIP";
import { EvmService } from ".";
import { prevalidateTransactionCommon } from "../../common";
import { getMaxSpendable } from "../logic";

async function prevalidateTransaction(this: EvmService, transaction: Transaction): Promise<void> {
  transaction.status = await prevalidateTransactionCommon(transaction.data, async (address: string) =>
    isValidAddress(address)
  );
}

async function validateTransaction(this: EvmService, transaction: Transaction): Promise<void> {
  const maxSpendable = await getMaxSpendable(this.chainId, transaction.data);
  // amount & fees are safe to cast as they're guaranteed to be filed in by completeTransaction
  const amount = transaction.data.amount as bigint;
  const fees = transaction.data.fees as bigint;

  switch (transaction.data.mode) {
    case TransactionMode.TRANSFER: {
      if (amount + fees > maxSpendable.native) {
        transaction.status.errors.push({ message: "Balance is too low" });
      } else if (amount < fees * 10n) {
        transaction.status.warnings.push({ message: "Network fees are above 10% of the amount" });
      }
      break;
    }
    case TransactionMode.TRANSFER_TOKEN: {
      if (fees > maxSpendable.native) {
        transaction.status.errors.push({
          message: "Balance is too low to cover the fees",
        });
      }
      if (maxSpendable.token === undefined || amount > maxSpendable.token) {
        transaction.status.errors.push({ message: "Token balance is too low" });
      }

      break;
    }
  }
}

export { prevalidateTransaction, validateTransaction };
