import { TransactionWrapper } from "~/app/model/types_WIP";
import { BtcService } from ".";
import { prevalidateTransactionCommon } from "../../common";
import { isValidAddress } from "../logic";



async function prevalidateTransaction(this: BtcService, transaction: TransactionWrapper): Promise<void> {
  transaction.status = await prevalidateTransactionCommon(transaction.data, async (address: string) =>
    isValidAddress(address, this.chainId)
  );
}

async function validateTransaction(
  this: BtcService,
  transaction: TransactionWrapper
): Promise<void> {
  throw new Error("Not implemented");
}

export { validateTransaction };

