import { getService } from "~/app/config/services";
import { ApiRequestFilters } from "~/app/model/types_WIP";
import { apiHandler } from "~/app/tools/handlers/apiHandler";
import { UserInputError } from "~/app/tools/handlers/errors";
import { pathParamsSchema, queryParamsSchema, responseSchema } from "./schema";

export const GET = apiHandler(
  {
    responseSchema,
    pathParamsSchema,
    queryParamsSchema,
  },
  async ({ pathParams, queryParams }) => {
    const { chainId, accountId } = pathParams;

    // Parse supported query params
    const filters: ApiRequestFilters = {};
    const pubKey = queryParams.pubkey;
    const include = queryParams.include;
    if (include) {
      // Use the schema to validate and process the include array
      const validInclude = queryParamsSchema.shape.include.parse(include);
      if (validInclude) {
        validInclude.forEach((param) => {
          filters[param] = true;
        });
      }
    }

    const service = getService(chainId);

    const isAccountIdValid = await service.validateAddress(accountId);

    if (!isAccountIdValid) {
      throw new UserInputError(`Invalid accountId ${accountId} for chainId ${chainId}`);
    }

    const state = await service.getAccountState(accountId, pubKey);

    // Apply filters
    // Each field is returned if (explicitly demanded OR nothing specific demanded)
    const includeNative = filters.native || !Object.keys(filters).length;
    const includeTokens = filters.tokens || !Object.keys(filters).length;
    const includeStaking = filters.staking || !Object.keys(filters).length;
    state.balances = {
      // Syntax trick to conditionally include fields
      ...(includeNative && { native: state.balances.native }),
      ...(includeTokens && { tokens: state.balances.tokens }),
      ...(includeStaking && { staking: state.balances.staking }),
    };

    return {
      chainId,
      accountId,
      ...state,
    };
  }
);
