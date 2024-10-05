import { AccountHistory } from "~/app/model/types_WIP";
import { AlgorandService } from ".";

async function getAccountHistory(this: AlgorandService, accountId: string): Promise<AccountHistory> {
  // TODO

  return {
    chainId: this.chainId,
    accountId,
    transactions: [],
  };
}

export { getAccountHistory };
