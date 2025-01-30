import { AccountHistory, Paginated } from "~/app/model/types_WIP";
import { UnsupportedFeatureError } from "~/app/tools/handlers/errors";
import { StarknetService } from "../service";

async function getAccountHistory(
  this: StarknetService,
  accountId: string,
  paginationToken?: string
): Promise<Paginated<AccountHistory>> {
  throw new UnsupportedFeatureError("Not implemented");
}

export { getAccountHistory };
