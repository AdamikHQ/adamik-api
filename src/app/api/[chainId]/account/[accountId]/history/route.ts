import { getService } from "~/app/config/services";
import { ApiRequestFilters } from "~/app/model/types_WIP";
import { apiHandler } from "~/app/tools/handlers/apiHandler";
import { UserInputError } from "~/app/tools/handlers/errors";
import { pathParamsSchema, queryParamsSchema, responseSchema } from "./schema";

export const GET = apiHandler(
  {
    pathParamsSchema,
    responseSchema,
    queryParamsSchema,
  },
  async ({ pathParams, queryParams }) => {
    const { chainId, accountId } = pathParams;

    // Parse supported query params like : /.../...?include=parsed,raw
    // to build an ApiRequestFilters object like : { parsed?: true, raw?: true }
    const filters: ApiRequestFilters = {};
    queryParams.include?.forEach((param) => {
      filters[param] = true;
    });

    const paginationToken = queryParams.nextPage;

    const service = getService(chainId);

    const isAccountIdValid = await service.validateAddress(accountId);

    if (!isAccountIdValid) {
      throw new UserInputError(`Invalid accountId ${accountId} for chainId ${chainId}`);
    }

    const { transactions, pagination } = await service.getAccountHistory(accountId, paginationToken);

    // Parsed is returned if (explicitely demanded OR nothing specific demanded)
    const includeParsed = filters.parsed || !Object.keys(filters).length;
    // Raw is returned only if explicitely demanded
    const includeRaw = filters.raw;

    const filteredTransactions = transactions.map((transaction) => ({
      // Syntax trick to conditionally include fields
      ...(includeParsed && { parsed: transaction.parsed }),
      ...(includeRaw && { raw: transaction.raw }),
    }));

    return {
      chainId,
      accountId,
      transactions: filteredTransactions,
      pagination,
    };
  }
);
