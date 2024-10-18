import { z } from "zod";
import { ValidationError } from "zod-validation-error";
import { getService } from "~/app/families/services";
import { ApiRequestFilters, ChainId } from "~/app/model/types_WIP";
import { apiHandler } from "~/app/tools/handlers/apiHandler";
import { includeEnum, queryParamsSchema, requestSchema, responseSchema } from "./schema";

type IncludeParam = z.infer<typeof includeEnum>;

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
    queryParams: z.infer<typeof queryParamsSchema>;
  }) => {
    const { chainId, accountId } = body;

    // Parse the raw query string to get all 'include' parameters
    // We use the raw query string instead of the parsed queryParams.include
    // to handle multiple 'include' parameters, which Next.js doesn't support by default
    const rawQueryString = queryParams.___rawQueryString;
    if (typeof rawQueryString !== "string") {
      throw new Error("Raw query string is missing or invalid");
    }
    const rawParams = new URLSearchParams(rawQueryString);
    const includeParams = rawParams.getAll("include");

    // Normalize and validate include parameters
    const normalizedParams = includeParams.flatMap((param) => param.split(",").map((item) => item.trim()));
    const validIncludeParams = normalizedParams.filter(
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
