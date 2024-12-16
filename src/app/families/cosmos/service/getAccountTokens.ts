import { AccountTokens, Paginated, TokenAmount } from "~/app/model/types_WIP";
import { UnsupportedFeatureError } from "~/app/tools/handlers/errors";
import { CosmosService } from "../service";

async function getAccountTokens(
  this: CosmosService,
  accountId: string,
  paginationToken?: string
): Promise<Paginated<AccountTokens>> {
  const accountTokenAmounts: TokenAmount[] = [];

  // TODO
  throw new UnsupportedFeatureError("Not implemented yet");

  return {
    tokens: accountTokenAmounts,
    pagination: {
      nextPage: null,
    },
  };
}

export { getAccountTokens };
