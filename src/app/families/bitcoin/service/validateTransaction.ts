import { TransactionMode, TransactionWrapper } from "~/app/model/types_WIP";
import { BtcService } from ".";
import { isValidAddress, isValidXpub } from "../logic";

async function prevalidateTransaction(this: BtcService, transaction: TransactionWrapper): Promise<void> {
  switch (transaction.data.mode) {
    case TransactionMode.TRANSFER:
      if (!isValidXpub(transaction.data.senders[0])) {
        transaction.status.errors.push({
          message: `Sender address ${transaction.data.senders[0]} is invalid for ${transaction.data.chainId}`,
        });
      }
      if (!isValidAddress(transaction.data.recipients[0], this.chainId)) {
        transaction.status.errors.push({
          message: `Recipient address ${transaction.data.recipients[0]} is invalid for ${transaction.data.chainId}`,
        });
      }
      // for now, we only support useMaxAmount for TRANSFER. Once Transfer to many is merged with Transfer, we can remove this check
      if (!transaction.data.useMaxAmount) {
        transaction.status.errors.push({
          message: `Missing field useMaxAmount for ${transaction.data.chainId}`,
        });
      }
      break;
    case TransactionMode.TRANSFER_TO_MANY:
      if (!isValidXpub(transaction.data.sender)) {
        transaction.status.errors.push({
          message: `Sender address ${transaction.data.sender} is invalid for ${transaction.data.chainId}`,
        });
      }
      for (const recipient of transaction.data.recipients) {
        if (!isValidAddress(recipient.address, this.chainId)) {
          transaction.status.errors.push({
            message: `Recipient address ${recipient.address} is invalid for ${transaction.data.chainId}`,
          });
        }
      }
      break;
    default:
      // should never happen, already checked by zod using defined supported features
      transaction.status.errors.push({
        message: `Invalid transaction mode: ${transaction.data.mode} for chainId ${transaction.data.chainId}`,
      });
      return;
  }
}

async function validateTransaction(this: BtcService, transaction: TransactionWrapper): Promise<void> {
  // TODO: call testmempoolaccept on BTC-core node
  return;
}

export { prevalidateTransaction, validateTransaction };
