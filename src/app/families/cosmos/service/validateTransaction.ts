import { Transaction } from "~/app/model/types_WIP";
import { prevalidateTransactionCommon } from "../../common";
import { isValidAddress } from "../logic";
import { CosmosService } from ".";

async function prevalidateTransaction(this: CosmosService, transaction: Transaction): Promise<void> {
  transaction.status = await prevalidateTransactionCommon(transaction.plain, async (address: string) =>
    isValidAddress(address, this.chainId)
  );
}

async function validateTransaction(this: CosmosService, transaction: Transaction): Promise<void> {
  // TODO
  // NOTE amount can't be 0 on cosmos chains?...
}

export { prevalidateTransaction, validateTransaction };
