import { ValidationError } from "zod-validation-error";
import { getService } from "~/app/config/services";
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

    // Parse supported query params like : /.../...?include=parsed,raw
    // to build an ApiRequestFilters object like : { parsed?: true, raw?: true }
    const filters: ApiRequestFilters = {};
    queryParams.include?.forEach((param) => {
      filters[param] = true;
    });

    const { from_timestamp: fromTimestamp, to_timestamp: toTimestamp } = queryParams;

    const service = getService(chainId);

    const isAccountIdValid = await service.validateAddress(accountId);

    if (!isAccountIdValid) {
      throw new ValidationError(`Invalid accountId ${accountId} for chainId ${chainId}`);
    }

    const history = await service.getAccountHistory(accountId, { fromTimestamp, toTimestamp });

    // Parsed is returned if (explicitely demanded OR nothing specific demanded)
    const includeParsed = filters.parsed || !Object.keys(filters).length;
    // Raw is returned only if explicitely demanded
    const includeRaw = filters.raw;

    history.transactions = history.transactions.map((transaction) => ({
      // Syntax trick to conditionally include fields
      ...(includeParsed && { parsed: transaction.parsed }),
      ...(includeRaw && { raw: transaction.raw }),
    }));

    return history;
  }
);
