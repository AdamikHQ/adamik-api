import { PlainTransaction, TransactionStatus, ErrorMsg, TransactionMode } from "~/app/model/types_WIP";
import { prevalidateTransactionCommon } from "../../common";
import { isValidAddress } from "../logic";
import { CosmosService } from ".";

async function prevalidateTransaction(
  this: CosmosService,
  transaction: PlainTransaction
): Promise<TransactionStatus> {
  return prevalidateTransactionCommon(transaction, async (address: string) =>
    isValidAddress(address, this.chainId)
  );
}

export { prevalidateTransaction };
