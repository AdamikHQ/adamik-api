import z from "zod";
import { ZodOpenApiPathsObject, extendZodWithOpenApi } from "zod-openapi";
import {
  bigintToStringSchema,
  chainIdSchemaParams,
  paginatedResponseSchema,
  paginationQueryParamsSchema,
  tokenSchema,
} from "~/app/api/schemaCommon";
import { CHAINS } from "~/app/config/chains";
import { ChainId } from "~/app/model/types_WIP";

extendZodWithOpenApi(z);

const supportedChainIds = Object.values(CHAINS)
  .filter((chain) => chain.supportedFeatures.read.account.balances.tokens)
  .map((chain) => chain.id);

const supportedChainIdsSchema = z.enum(supportedChainIds as [ChainId, ...ChainId[]], chainIdSchemaParams);

const requestSchema = z
  .object({
    chainId: supportedChainIdsSchema,
    accountId: z.string().openapi({
      description: "Account identifier (address, xpub, etc) for the specified chain ID",
    }),
  })
  .openapi({
    examples: [
      {
        chainId: ChainId.ETHEREUM,
        accountId: "0x0000000000000000000000000000000000000000",
      },
    ],
  });

const queryParamsSchema = paginationQueryParamsSchema;

const responseSchema = z
  .object({
    chainId: supportedChainIdsSchema,
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
  "/api/account/state/tokens": {
    post: {
      tags: ["account"],
      summary: "Retrieve an account's tokens",
      description:
        "Returns the tokens (amount and details) held by a specified account identifier and chain ID. This endpoint allows for pagination over the returned tokens.",
      requestParams: {
        query: queryParamsSchema,
      },
      requestBody: {
        content: {
          "application/json": { schema: requestSchema },
        },
      },
      responses: {
        "200": {
          description:
            "200 OK - Returns the current tokens information for the specified address and chain ID.",
          content: {
            "application/json": { schema: responseSchema },
          },
        },
      },
    },
  },
};

export { accountStateTokensOpenAPIPath, queryParamsSchema, requestSchema, responseSchema };
