import { ValidationError } from "zod-validation-error";
import { getService } from "~/app/families/services";
import { ApiRequestFilters } from "~/app/model/types_WIP";
import { apiHandler } from "~/app/tools/handlers/apiHandler";
import { queryParamsSchema, requestSchema, responseSchema } from "./schema";

export const POST = apiHandler(
  {
    requestSchema,
    responseSchema,
    queryParamsSchema,
  },
  async ({ body, queryParams }) => {
    const { chainId, accountId } = body;

    // Parse supported query params like : /.../...?include=native,tokens,staking
    // to build an ApiRequestFilters object like : { native?: true, tokens?: true, staking?: true }
    const filters: ApiRequestFilters = {};
    queryParams.include?.forEach((param) => {
      filters[param] = true;
    });

    const service = getService(chainId);

    const isAccountIdValid = await service.validateAddress(accountId);

    if (!isAccountIdValid) {
      throw new ValidationError(`Invalid accountId ${accountId} for chainId ${chainId}`);
    }

    const state = await service.getAccountState(accountId);

    // Apply filters
    // Each field is returned if (explicitely demanded OR nothing specific demanded)
    const includeNative = filters.native || !Object.keys(filters).length;
    const includeTokens = filters.tokens || !Object.keys(filters).length;
    const includeStaking = filters.staking || !Object.keys(filters).length;
    state.balances = {
      // Syntax trick to conditionally include fields
      ...(includeNative && { native: state.balances.native }),
      ...(includeTokens && { tokens: state.balances.tokens }),
      ...(includeStaking && { staking: state.balances.staking }),
    };

    return state;
  }
);
