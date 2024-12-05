import { AccountHistory, Paginated } from "~/app/model/types_WIP";
import { StarknetService } from "../service";

async function getAccountHistory(
  this: StarknetService,
  accountId: string,
  paginationToken?: string
): Promise<Paginated<AccountHistory>> {
  throw new Error("Not implemented");
}

export { getAccountHistory };
