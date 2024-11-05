import { AccountHistory } from "../../../model/types_WIP";
import { TronService } from "../service";

async function getAccountHistory(this: TronService, accountId: string): Promise<AccountHistory> {
  // TODO

  return {
    chainId: this.chainId,
    accountId,
    transactions: [],
  };
}

export { getAccountHistory };
