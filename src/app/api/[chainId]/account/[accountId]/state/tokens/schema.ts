import z from "zod";
import { ZodOpenApiPathsObject } from "zod-openapi";
import "zod-openapi/extend";
import {
  accountIdSchema,
  bigintToStringSchema,
  getSupportedChainIdsSchema,
  paginatedResponseSchema,
  paginationQueryParamsSchema,
  tokenSchema,
} from "~/app/api/schemaCommon";
import { Chain } from "~/app/model/types_WIP";

const chainIdFilters = (chain: Chain) => chain.supportedFeatures.read.account.balances.tokens;

const chainIdSchema = getSupportedChainIdsSchema(chainIdFilters);

const pathParamsSchema = z.object({
  chainId: chainIdSchema,
  accountId: accountIdSchema,
});

const queryParamsSchema = paginationQueryParamsSchema;

const responseSchema = z
  .object({
    chainId: chainIdSchema,
    accountId: z.string(),
    balances: z.object({
      tokens: z
        .object({
          token: tokenSchema,
          amount: bigintToStringSchema.openapi({
            description:
              "Current balance of this token owned by the account. The amount is expressed in the token's smallest unit (based on its decimals).",
          }),
        })
        .array()
        .optional(),
    }),
  })
  .merge(paginatedResponseSchema);

const accountStateTokensOpenAPIPath: ZodOpenApiPathsObject = {
  "/api/{chainId}/account/{accountId}/state/tokens": {
    get: {
      tags: ["Account"],
      summary: "Get Account Tokens (paginated)",
      description:
        "Returns the tokens (amount and details) held by a specified account identifier and chain ID. This endpoint allows for pagination over the returned tokens.",
      requestParams: {
        path: pathParamsSchema,
        query: queryParamsSchema,
      },
      responses: {
        "200": {
          description: "Returns the current tokens information for the specified address and chain ID.",
          content: {
            "application/json": { schema: responseSchema },
          },
        },
      },
    },
  },
};

export { accountStateTokensOpenAPIPath, pathParamsSchema, queryParamsSchema, responseSchema };
