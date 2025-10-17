import z from "zod";
import { ZodOpenApiPathsObject } from "zod-openapi";
import {
  bigintToStringSchema,
  getSupportedChainIdsSchema,
  paginatedResponseSchema,
  paginationQueryParamsSchema,
} from "~/app/api/schemaCommon";
import { Chain } from "~/app/model/types_WIP";

const chainIdFilters = (chain: Chain) => chain.supportedFeatures.read.validators;

const chainIdSchema = getSupportedChainIdsSchema(chainIdFilters);

const pathParamsSchema = z.object({
  chainId: chainIdSchema,
});

const queryParamsSchema = paginationQueryParamsSchema;

const responseSchema = z
  .object({
    chainId: chainIdSchema,
    validators: z
      .object({
        address: z.string(),
        name: z.string(),
        commission: z.number().optional(),
        stakedAmount: bigintToStringSchema.optional(),
      })
      .array(),
  })
  .merge(paginatedResponseSchema);

const validatorsOpenAPIPath: ZodOpenApiPathsObject = {
  "/api/{chainId}/validators": {
    get: {
      tags: ["Chain"],
      summary: "Get Chain Validators",
      description:
        "Lists validators for a specified chain ID, including their operational status and commission rates. Useful for delegation operations on proof-of-stake blockchains.",
      requestParams: {
        path: pathParamsSchema,
        query: queryParamsSchema,
      },
      responses: {
        "200": {
          description:
            "Returns a list of validators, their status, and commission details for the specified chain ID.",
          content: {
            "application/json": { schema: responseSchema },
          },
        },
      },
    },
  },
};

export { pathParamsSchema, queryParamsSchema, responseSchema, validatorsOpenAPIPath };
