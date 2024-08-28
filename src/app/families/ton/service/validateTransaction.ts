import { Address } from "@ton/core";
import { Transaction } from "~/app/model/types_WIP";
import { TonService } from ".";
import { prevalidateTransactionCommon } from "../../common";

async function prevalidateTransaction(this: TonService, transaction: Transaction): Promise<void> {

  transaction.status = await prevalidateTransactionCommon(transaction.data, async (address: string) => {
    try {
      Address.parse(address);
      return true;
    }
    catch (e) { return false; }
  }
  );

  if (transaction.data.format) {
    transaction.status.warnings.push({
      message: `Field 'format' is not supported for chain ID ${this.chainId}`,
    });
  }
}

async function validateTransaction(this: TonService, transaction: Transaction): Promise<void> {

}

export { prevalidateTransaction, validateTransaction };

