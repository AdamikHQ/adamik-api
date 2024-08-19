import { TransactionMode, Transaction } from "~/app/model/types_WIP";
import { BtcService } from ".";
import { isValidAddress, isValidXpub } from "../logic";

async function prevalidateTransaction(this: BtcService, transaction: Transaction): Promise<void> {
  if (!isValidXpub(transaction.data.sender)) {
    transaction.status.errors.push({
      message: `Sender address ${transaction.data.sender} is invalid for ${transaction.data.chainId}`,
    });
  }
  if (!isValidAddress(transaction.data.recipients[0].address, this.chainId)) {
    transaction.status.errors.push({
      message: `Recipient address ${transaction.data.recipients[0]} is invalid for ${transaction.data.chainId}`,
    });
  }
}

async function validateTransaction(this: BtcService, transaction: Transaction): Promise<void> {
  // TODO: call testmempoolaccept on BTC-core node
  return;
}

export { prevalidateTransaction, validateTransaction };
