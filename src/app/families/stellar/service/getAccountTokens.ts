import { AccountTokens, Paginated } from "~/app/model/types_WIP";
import { UnsupportedFeatureError } from "~/app/tools/handlers/errors";
import { StellarService } from "../service";

async function getAccountTokens(
  this: StellarService,
  accountId: string,
  paginationToken?: string
): Promise<Paginated<AccountTokens>> {
  // TODO
  throw new UnsupportedFeatureError("Not supported");
}

export { getAccountTokens };
