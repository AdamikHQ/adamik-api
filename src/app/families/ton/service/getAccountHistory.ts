import { AccountHistory } from "~/app/model/types_WIP";
import { TonService } from ".";

async function getAccountHistory(this: TonService, accountId: string): Promise<AccountHistory> {
  // TODO

  return {
    chainId: this.chainId,
    accountId,
    transactions: [],
  };
}

export { getAccountHistory };
