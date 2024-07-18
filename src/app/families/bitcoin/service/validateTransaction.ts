import { Transaction } from "~/app/model/types_WIP";
import { BitcoinService } from ".";
import { isValidAddress, isValidXpub } from "../logic";

async function prevalidateTransaction(this: BitcoinService, transaction: Transaction): Promise<void> {
  if (
    !isValidXpub(this.chainId, transaction.data.sender) &&
    !isValidAddress(this.chainId, transaction.data.sender)
  ) {
    transaction.status.errors.push({
      message: `Sender address ${transaction.data.sender} is invalid for ${transaction.data.chainId}`,
    });
  }
  if (!isValidAddress(this.chainId, transaction.data.recipient)) {
    transaction.status.errors.push({
      message: `Recipient address ${transaction.data.recipient} is invalid for ${transaction.data.chainId}`,
    });
  }
}

async function validateTransaction(this: BitcoinService, transaction: Transaction): Promise<void> {
  // TODO: call testmempoolaccept on BTC-core node
  return;
}

export { prevalidateTransaction, validateTransaction };
