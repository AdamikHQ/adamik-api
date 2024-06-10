import { isValidAddress } from "algosdk";
import { PlainTransaction, TransactionStatus } from "~/app/model/types_WIP";
import { prevalidateTransactionCommon } from "../../common";
import { AlgorandService } from ".";

async function prevalidateTransaction(
  this: AlgorandService,
  transaction: PlainTransaction
): Promise<TransactionStatus> {
  return prevalidateTransactionCommon(transaction, async (address: string) => isValidAddress(address));
}

export { prevalidateTransaction };
