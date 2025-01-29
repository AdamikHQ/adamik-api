import { Status, Transaction, TransactionMode } from "~/app/model/types_WIP";
import { isTaprootAddress, isValidAddress, isValidXpub } from "../logic";
import { BitcoinService } from "../service";

async function prevalidateTransaction(
  this: BitcoinService,
  _: {
    transaction: Transaction;
    status: Status;
  }
): Promise<void> {
  const { transaction, status } = _;

  if (
    !isValidXpub(this.chainId, transaction.data.senderAddress) &&
    !isValidAddress(this.chainId, transaction.data.senderAddress)
  ) {
    status.errors.push({
      message: `Sender address ${transaction.data.senderAddress} is invalid for ${this.chainId}`,
    });
  }

  switch (transaction.data.mode) {
    case TransactionMode.TRANSFER:
      if (!isValidAddress(this.chainId, transaction.data.recipientAddress)) {
        status.errors.push({
          message: `Recipient address ${transaction.data.recipientAddress} is invalid for ${this.chainId}`,
        });
      }
      break;
    case TransactionMode.STAKE:
    case TransactionMode.UNSTAKE:
      // FIXME Try to support useMaxAmount for staking transactions too
      if (transaction.data.useMaxAmount) {
        status.errors.push({
          message: `useMaxAmount is not supported for ${this.chainId} staking transactions`,
        });
      }

      // TODO Validator address validation

      if (isTaprootAddress(transaction.data.senderAddress) && !transaction.data.senderPubKey) {
        status.errors.push({
          message: "Public key of the sender address must be provided when it's a taproot address",
        });
      }
      break;
  }
}

async function validateTransaction(
  this: BitcoinService,
  _: {
    transaction: Transaction;
    status: Status;
  }
): Promise<void> {
  // TODO Check that amount > dust

  return;
}

export { prevalidateTransaction, validateTransaction };
