import z from "zod";
import { ZodOpenApiPathsObject } from "zod-openapi";
import { chainIdSchema, paginationSchema } from "~/app/api/schemaCommon";

const urlParamsSchema = z.object({
  chainId: chainIdSchema,
});

const requestSchema = z.object({
  pagination: paginationSchema.optional(),
});

const responseSchema = z.object({
  validators: z.object({
    address: z.string(),
    name: z.string(),
    commission: z.number().optional(), // TODO: maybe we want a default value rather than an optional?
  }).array(),
});

const chainsChainIdValidatorsOpenAPIPath: ZodOpenApiPathsObject = {
  "/api/chains/{chainId}/validators": {
    post: {
      tags: ["chains"],
      description:
        "Lists validators for a specified chain ID, including their operational status and commission rates. Supports pagination through 'limit' and 'offset' parameters. Useful for delegation operations on proof-of-stake blockchains.",
      requestBody: {
        content: {
          "application/json": { schema: requestSchema },
        },
      },
      requestParams: {
        path: urlParamsSchema,
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

export { chainsChainIdValidatorsOpenAPIPath, requestSchema, responseSchema, urlParamsSchema };

