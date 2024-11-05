import { AccountHistory } from "~/app/model/types_WIP";
import { BitcoinService } from "../service";

async function getAccountHistory(this: BitcoinService, accountId: string): Promise<AccountHistory> {
  // TODO

  return {
    chainId: this.chainId,
    accountId,
    transactions: [],
  };
}

export { getAccountHistory };
