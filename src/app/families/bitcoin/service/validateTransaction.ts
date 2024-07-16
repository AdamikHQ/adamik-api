import { TransactionWrapper } from "~/app/model/types_WIP";
import { BtcService } from ".";

async function prevalidateTransaction(this: BtcService, transaction: TransactionWrapper): Promise<void> {
  // does nothing, everything is already done by zod schema before even reaching the controller
}

async function validateTransaction(this: BtcService, transaction: TransactionWrapper): Promise<void> {
  // TODO: call testmempoolaccept on BTC-core node
  return;
}

export { prevalidateTransaction, validateTransaction };
