import { AccountState } from "~/app/model/types_WIP";
import { fetchAccountData as fetchAccountDataFromTronscan } from "../backend/tronscan";

import { getAccountStatefromProviders } from "../../common";
import { TronService } from "../service";

async function getAccountState(this: TronService, accountId: string): Promise<AccountState> {
  const fetchAccountDataFunctions = [fetchAccountDataFromTronscan];

  return getAccountStatefromProviders(this.chainId, accountId, fetchAccountDataFunctions);
}

export { getAccountState };
