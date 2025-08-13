import { AccountState } from "~/app/model/types_WIP";
import { fetchAccount } from "../backend/horizon";
import { StellarService } from "../service";

async function getAccountState(this: StellarService, accountId: string): Promise<AccountState> {
  return await fetchAccount(accountId);
}

export { getAccountState };
