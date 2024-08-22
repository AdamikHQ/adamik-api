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
  if (!transaction.data.recipients[0].amount) {
    // should never happen in practice as completeTransaction should have been called first
    throw new Error("Must specify an amount for the recipient");
  }

  const maxSpendable = await getMaxSpendable(this.chainId, transaction.data);

  switch (transaction.data.mode) {
    case TransactionMode.TRANSFER: {
      if (transaction.data.recipients[0].amount + transaction.data.fees > maxSpendable.native) {
        transaction.status.errors.push({ message: "Balance is too low" });
      } else if (transaction.data.recipients[0].amount < transaction.data.fees * 10n) {
        transaction.status.warnings.push({ message: "Network fees are above 10% of the amount" });
      }
      break;
    }
    case TransactionMode.TRANSFER_TOKEN: {
      if (transaction.data.fees > maxSpendable.native) {
        transaction.status.errors.push({
          message: "Balance is too low to cover the fees",
        });
      }
      if (maxSpendable.token === undefined || transaction.data.recipients[0].amount > maxSpendable.token) {
        transaction.status.errors.push({ message: "Token balance is too low" });
      }

      break;
    }
  }
}

export { prevalidateTransaction, validateTransaction };
