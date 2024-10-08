import { getService } from "~/app/families/services";
import { ApiRequestFilters } from "~/app/model/types_WIP";
import { apiHandler, type AdamikStatus } from "~/app/tools/handlers/apiHandler";
import { UserInputError } from "~/app/tools/handlers/errors";
import { pathParamsSchema, queryParamsSchema, responseSchema } from "./schema";

export const GET = apiHandler(
  {
    pathParamsSchema,
    queryParamsSchema,
    responseSchema,
  },
  async ({ pathParams, queryParams }) => {
    const { transactionId, chainId } = pathParams;

    // Parse supported query params like : /.../...?include=parsed,raw
    // to build an ApiRequestFilters object like : { parsed?: true, raw?: true }
    const filters: ApiRequestFilters = {};
    queryParams.include?.forEach((param) => {
      filters[param] = true;
    });

    const service = getService(chainId);

    let status: AdamikStatus = { errors: [], warnings: [] };

    const transaction = await service.getTransaction(transactionId, status);
    if (!transaction) {
      throw new UserInputError(
        "Transaction not found",
        `Transaction ${transactionId} not found for chainId ${chainId}`
      );
    }

    // Apply filters
    if (filters.parsed && !transaction.parsed) {
      throw new UserInputError(
        "Transaction not supported",
        `Parsing currently not supported for transaction ${transactionId}`
      );
    }

    // Each field is returned if (explicitely demanded OR nothing specific demanded)
    const includeParsed = filters.parsed || !Object.keys(filters).length;
    const includeRaw = filters.raw || !Object.keys(filters).length;

    return {
      // Syntax trick to conditionally include fields
      ...(includeParsed && { parsed: transaction.parsed }),
      ...(includeRaw && { raw: transaction.raw }),
    };
  }
);
