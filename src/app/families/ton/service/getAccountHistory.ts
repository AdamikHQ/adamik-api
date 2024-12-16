import { AccountHistory, Paginated } from "~/app/model/types_WIP";
import { UnsupportedFeatureError } from "~/app/tools/handlers/errors";
import { TonService } from "../service";

async function getAccountHistory(
  this: TonService,
  accountId: string,
  paginationToken?: string
): Promise<Paginated<AccountHistory>> {
  // TODO
  throw new UnsupportedFeatureError("Not implemented yet");

  return {
    transactions: [],
    pagination: {
      nextPage: null,
    },
  };
}

export { getAccountHistory };
