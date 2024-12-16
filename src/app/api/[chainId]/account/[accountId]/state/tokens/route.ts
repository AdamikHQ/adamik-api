import { getService } from "~/app/config/services";
import { isTokenService } from "~/app/model/service";
import { apiHandler } from "~/app/tools/handlers/apiHandler";
import { UnsupportedFeatureError, UserInputError } from "~/app/tools/handlers/errors";
import { pathParamsSchema, queryParamsSchema, responseSchema } from "./schema";

export const GET = apiHandler(
  {
    responseSchema,
    pathParamsSchema,
    queryParamsSchema,
  },
  async ({ pathParams, queryParams }) => {
    const { chainId, accountId } = pathParams;
    const paginationToken = queryParams.nextPage;

    const service = getService(chainId);

    const isAccountIdValid = await service.validateAddress(accountId);

    if (!isAccountIdValid) {
      throw new UserInputError(`Invalid accountId ${accountId} for chainId ${chainId}`);
    }

    if (!isTokenService(service)) {
      throw new UnsupportedFeatureError(`Tokens are not supported for chainId ${chainId}`);
    }

    const { tokens, pagination } = await service.getAccountTokens(accountId, paginationToken);

    return {
      chainId,
      accountId,
      balances: {
        tokens,
      },
      pagination,
    };
  }
);
