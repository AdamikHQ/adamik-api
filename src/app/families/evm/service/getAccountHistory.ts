import { AccountHistory } from "~/app/model/types_WIP";
import { EvmService } from ".";

async function getAccountHistory(this: EvmService, accountId: string): Promise<AccountHistory> {
  // TODO

  return {
    chainId: this.chainId,
    accountId,
    transactions: [],
  };
}

export { getAccountHistory };
