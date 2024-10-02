import { Transaction } from "~/app/model/types_WIP";
import type { AdamikStatus } from "~/app/tools/handlers/apiHandler";
import { TonService } from ".";
import { prevalidateTransactionCommon } from "../../common";
import { isAddressValid } from "../logic";

async function prevalidateTransaction(
  this: TonService,
  transaction: Transaction,
  status: AdamikStatus
): Promise<void> {
  status = await prevalidateTransactionCommon(transaction.data, isAddressValid);

  if (transaction.data.format) {
    status.warnings.push({
      message: `Field 'format' is not supported for chain ID ${this.chainId}, it will be ignored`,
    });
  }
}

async function validateTransaction(this: TonService, transaction: Transaction): Promise<void> {
  // TODO
}

export { prevalidateTransaction, validateTransaction };
