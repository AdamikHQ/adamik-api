import { Status, Transaction, TransactionMode } from "~/app/model/types_WIP";
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

  await prevalidateTransactionCommon(this.chainId, {
    transactionData: transaction.data,
    status,
    addressValidationFn: isAddressValid,
  });
}

async function validateTransaction(
  this: TonService,
  _: {
    transaction: Transaction;
    status: Status;
  }
): Promise<void> {
  const { transaction, status } = _;

  // TODO: More checks
  if (
    transaction.data.mode === TransactionMode.TRANSFER &&
    transaction.data.nonce === 0n &&
    !transaction.data.senderPubKey
  ) {
    status.errors.push({
      message: `Field 'senderPubKey' is required in order to initialize the wallet`,
    });
  }
}

export { prevalidateTransaction, validateTransaction };
