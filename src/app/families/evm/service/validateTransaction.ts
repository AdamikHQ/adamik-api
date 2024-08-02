import { isAddress as isValidAddress } from "viem";
import { Transaction, TransactionMode } from "~/app/model/types_WIP";
import { prevalidateTransactionCommon } from "../../common";
import { EvmService } from ".";
import { getMaxSpendable } from "../logic";

async function prevalidateTransaction(this: EvmService, transaction: Transaction): Promise<void> {
  transaction.status = await prevalidateTransactionCommon(transaction.plain, async (address: string) =>
    isValidAddress(address)
  );
}

async function validateTransaction(this: EvmService, transaction: Transaction): Promise<void> {
  const maxSpendable = await getMaxSpendable(this.chainId, transaction.plain);

  switch (transaction.plain.mode) {
    case TransactionMode.TRANSFER: {
      if (transaction.plain.amount + transaction.plain.fees > maxSpendable.native) {
        transaction.status.errors.push({ message: "Balance is too low" });
      } else if (transaction.plain.amount < transaction.plain.fees * 10n) {
        transaction.status.warnings.push({ message: "Network fees are above 10% of the amount" });
      }
      break;
    }
    case TransactionMode.TRANSFER_TOKEN: {
      if (transaction.plain.fees > maxSpendable.native) {
        transaction.status.errors.push({
          message: "Balance is too low to cover the fees",
        });
      }
      if (maxSpendable.token !== undefined && transaction.plain.amount > maxSpendable.token) {
        transaction.status.errors.push({ message: "Token balance is too low" });
      }

      break;
    }
  }
}

export { prevalidateTransaction, validateTransaction };
