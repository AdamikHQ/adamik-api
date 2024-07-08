import { Transaction } from "~/app/model/types_WIP";
import { prevalidateTransactionCommon } from "../../common";
import { isValidAddress } from "../logic";
import { CosmosService } from ".";

async function prevalidateTransaction(this: CosmosService, transaction: Transaction): Promise<void> {
  transaction.status = await prevalidateTransactionCommon(transaction.plain, async (address: string) =>
    isValidAddress(address, this.chainId)
  );

  // Amount can't be 0 on cosmos chains
  if (transaction.plain.amount === 0n) {
    transaction.status.errors.push({
      message: `Amount cannot be 0 on chain ${this.chainId}`,
    });
  }
}

async function validateTransaction(this: CosmosService, transaction: Transaction): Promise<void> {
  // TODO
}

export { prevalidateTransaction, validateTransaction };
