import { getService } from "~/app/families/services";
import { ApiRequestFilters, Status } from "~/app/model/types_WIP";
import { apiHandler } from "~/app/tools/handlers/apiHandler";
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

    let status: Status = { errors: [], warnings: [] };

    const transaction = await service.getTransaction(transactionId, status);
    if (!transaction) {
      throw new UserInputError(`Transaction ${transactionId} not found for chainId ${chainId}`);
    }

    // Apply filters
    if (!transaction.parsed) {
      if (!filters.raw) {
        status.errors.push({ message: `Parsing currently not supported for transaction ${transactionId}` });
      } else if (filters.parsed) {
        status.warnings.push({ message: `Parsing currently not supported for transaction ${transactionId}` });
      }
    }

    // Parsed is returned if (explicitly demanded OR nothing specific demanded)
    const includeParsed = filters.parsed || !Object.keys(filters).length;
    // Raw is returned only if explicitly demanded
    const includeRaw = filters.raw;

    return {
      transaction: {
        // Syntax trick to conditionally include fields
        ...(includeParsed && { parsed: transaction.parsed }),
        ...(includeRaw && { raw: transaction.raw }),
      },
      status,
    };
  }
);
