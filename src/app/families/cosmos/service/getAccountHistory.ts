import { AccountHistory } from "~/app/model/types_WIP";
import { CosmosService } from ".";

async function getAccountHistory(this: CosmosService, accountId: string): Promise<AccountHistory> {
  // TODO

  return {
    chainId: this.chainId,
    accountId,
    transactions: [],
  };
}

export { getAccountHistory };
