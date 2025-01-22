import { AccountState } from "~/app/model/types_WIP";
import { fetchAccount } from "../backend/node";
import { StarknetService } from "../service";

async function getAccountState(this: StarknetService, accountId: string): Promise<AccountState> {
  return await fetchAccount(accountId);
}

export { getAccountState };
