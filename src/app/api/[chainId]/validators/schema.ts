import z from "zod";
import { ZodOpenApiPathsObject } from "zod-openapi";
import {
  getSupportedChainIdsSchema,
  paginatedResponseSchema,
  paginationQueryParamsSchema,
} from "~/app/api/schemaCommon";
import { CHAINS } from "~/app/config/chains";

const supportedChainIds = Object.values(CHAINS)
  .filter((chain) => chain.supportedFeatures.read.validators)
  .map((chain) => chain.id);

const pathParamsSchema = z.object({
  chainId: getSupportedChainIdsSchema(supportedChainIds),
});

const queryParamsSchema = paginationQueryParamsSchema;

const responseSchema = z
  .object({
    chainId: getSupportedChainIdsSchema(supportedChainIds),
    validators: z
      .object({
        address: z.string(),
        name: z.string(),
        commission: z.number().optional(),
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
            "200 OK - Returns a list of validators, their status, and commission details for the specified chain ID.",
          content: {
            "application/json": { schema: responseSchema },
          },
        },
      },
    },
  },
};

export { pathParamsSchema, queryParamsSchema, responseSchema, validatorsOpenAPIPath };
