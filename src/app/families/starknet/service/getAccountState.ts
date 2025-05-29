import { AccountState } from "~/app/model/types_WIP";
import { calculateAccountState } from "../logic";
import { StarknetService } from "../service";

async function getAccountState(this: StarknetService, accountId: string): Promise<AccountState> {
  return calculateAccountState(this.chainId, accountId);
}

export { getAccountState };

