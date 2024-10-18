import { z } from "zod";
import { ValidationError } from "zod-validation-error";
import { getService } from "~/app/families/services";
import { ApiRequestFilters, ChainId } from "~/app/model/types_WIP";
import { apiHandler } from "~/app/tools/handlers/apiHandler";
import { includeEnum, queryParamsSchema, requestSchema, responseSchema } from "./schema";

type IncludeParam = z.infer<typeof includeEnum>;

interface QueryParams {
  include?: string | string[] | IncludeParam | IncludeParam[];
}

export const POST = apiHandler(
  {
    requestSchema,
    responseSchema,
    queryParamsSchema,
  },
  async ({
    body,
    queryParams,
  }: {
    body: { chainId: string; accountId: string };
    queryParams: QueryParams;
  }) => {
    const { chainId, accountId } = body;

    // Parse and validate query parameters
    const parsedQueryParams = queryParamsSchema.parse(queryParams);

    // Normalize include to always be an array of valid options
    const includeParams: string[] = Array.isArray(parsedQueryParams.include)
      ? parsedQueryParams.include.flatMap((item) =>
          typeof item === "string" ? item.split(",").map((s) => s.trim()) : item
        )
      : parsedQueryParams.include
      ? [parsedQueryParams.include].flatMap((item) =>
          typeof item === "string" ? item.split(",").map((s) => s.trim()) : item
        )
      : [];

    // Filter out any invalid include params
    const validIncludeParams = includeParams.filter(
      (param): param is IncludeParam => includeEnum.safeParse(param).success
    );

    // Populate filters based on includeParams
    const filters: ApiRequestFilters = Object.fromEntries(validIncludeParams.map((param) => [param, true]));

    const service = getService(chainId as ChainId);
    const isAccountIdValid = await service.validateAddress(accountId);

    if (!isAccountIdValid) {
      throw new ValidationError(`Invalid accountId ${accountId} for chainId ${chainId}`);
    }

    const state = await service.getAccountState(accountId);

    // Apply filters
    const includeAll = validIncludeParams.length === 0;
    state.balances = {
      ...(filters.native || includeAll ? { native: state.balances.native } : {}),
      ...(filters.tokens || includeAll ? { tokens: state.balances.tokens } : {}),
      ...(filters.staking || includeAll ? { staking: state.balances.staking } : {}),
    };

    return state;
  }
);
