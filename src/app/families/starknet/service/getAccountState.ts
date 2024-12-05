import { AccountState } from "~/app/model/types_WIP";
import { StarknetService } from "../service";

async function getAccountState(this: StarknetService, accountId: string): Promise<AccountState> {
  throw new Error("Not implemented");
}

export { getAccountState };
