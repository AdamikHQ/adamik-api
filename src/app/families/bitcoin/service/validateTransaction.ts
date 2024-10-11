import { Status, Transaction } from "~/app/model/types_WIP";
import { BitcoinService } from ".";
import { isValidAddress, isValidXpub } from "../logic";

async function prevalidateTransaction(
  this: BitcoinService,
  _: {
    transaction: Transaction;
    status: Status;
  }
): Promise<void> {
  const { transaction, status } = _;

  if (
    !isValidXpub(this.chainId, transaction.data.sender) &&
    !isValidAddress(this.chainId, transaction.data.sender)
  ) {
    status.errors.push({
      message: `Sender address ${transaction.data.sender} is invalid for ${transaction.data.chainId}`,
    });
  }
  if (!isValidAddress(this.chainId, transaction.data.recipient)) {
    status.errors.push({
      message: `Recipient address ${transaction.data.recipient} is invalid for ${transaction.data.chainId}`,
    });
  }
}

async function validateTransaction(
  this: BitcoinService,
  _: {
    transaction: Transaction;
    status: Status;
  }
): Promise<void> {
  // TODO: call testmempoolaccept on BTC-core node
  return;
}

export { prevalidateTransaction, validateTransaction };
