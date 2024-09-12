import { Transaction } from "~/app/model/types_WIP";
import { TonService } from ".";
import { prevalidateTransactionCommon } from "../../common";
import { isAddressValid } from "../logic";

async function prevalidateTransaction(this: TonService, transaction: Transaction): Promise<void> {
  transaction.status = await prevalidateTransactionCommon(transaction.data, isAddressValid);

  if (transaction.data.format) {
    transaction.status.warnings.push({
      message: `Field 'format' is not supported for chain ID ${this.chainId}`,
    });
  }
}

async function validateTransaction(this: TonService, transaction: Transaction): Promise<void> {
  // TODO
}

export { prevalidateTransaction, validateTransaction };
