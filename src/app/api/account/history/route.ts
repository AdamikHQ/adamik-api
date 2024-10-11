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

    // Parse supported filters like : /.../...?include=native,tokens,staking
    // to build an ApiRequestFilters object like : { native?: true, tokens?: true, staking?: true }
    const filters: ApiRequestFilters = {};
    // TODO Support filtering
    /*
    queryParams.include?.forEach((param) => {
      filters[param] = true;
    });
    */

    const { from_timestamp: fromTimestamp, to_timestamp: toTimestamp } = queryParams;

    const service = getService(chainId);

    const isAccountIdValid = await service.validateAddress(accountId);

    if (!isAccountIdValid) {
      throw new ValidationError(`Invalid accountId ${accountId} for chainId ${chainId}`);
    }

    const history = await service.getAccountHistory(accountId, { fromTimestamp, toTimestamp }, filters);

    return history;
  }
);
