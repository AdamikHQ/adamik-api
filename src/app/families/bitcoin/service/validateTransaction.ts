import { Status, Transaction } from "~/app/model/types_WIP";
import { isValidAddress, isValidXpub } from "../logic";
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

  if (!isValidAddress(this.chainId, transaction.data.recipientAddress)) {
    status.errors.push({
      message: `Recipient address ${transaction.data.recipientAddress} is invalid for ${this.chainId}`,
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
