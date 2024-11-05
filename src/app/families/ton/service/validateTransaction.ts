import { Status, Transaction } from "~/app/model/types_WIP";
import { prevalidateTransactionCommon } from "../../common";
import { isAddressValid } from "../logic";
import { TonService } from "../service";

async function prevalidateTransaction(
  this: TonService,
  _: {
    transaction: Transaction;
    status: Status;
  }
): Promise<void> {
  const { transaction, status } = _;

  await prevalidateTransactionCommon({
    transactionData: transaction.data,
    status,
    addressValidationFn: isAddressValid,
  });

  if (transaction.data.format) {
    status.warnings.push({
      message: `Field 'format' is not supported for chain ID ${this.chainId}, it will be ignored`,
    });
  }
}

async function validateTransaction(
  this: TonService,
  _: {
    transaction: Transaction;
    status: Status;
  }
): Promise<void> {
  // TODO
}

export { prevalidateTransaction, validateTransaction };
