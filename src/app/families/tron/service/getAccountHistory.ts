import { TronService } from ".";
import { AccountHistory } from "../../../model/types_WIP";

async function getAccountHistory(this: TronService, accountId: string): Promise<AccountHistory> {
  // TODO

  return {
    chainId: this.chainId,
    accountId,
    transactions: [],
  };
}

export { getAccountHistory };
