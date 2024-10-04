import z from "zod";
import { ZodOpenApiPathsObject } from "zod-openapi";
import { chainIdSchema } from "~/app/api/schemaCommon";

const requestSchema = z.object({
  chainId: chainIdSchema,
});

const requestParamsSchema = z.object({
  offset: z.number().optional(),
  limit: z.number().optional(),
});

const responseSchema = z.object({
  chainId: chainIdSchema,
  validators: z
    .object({
      address: z.string(),
      name: z.string(),
      commission: z.number().optional(),
    })
    .array(),
});

const chainsChainIdValidatorsOpenAPIPath: ZodOpenApiPathsObject = {
  "/api/chains/{chainId}/validators": {
    get: {
      tags: ["chains"],
      summary: "Retrieve the list of existing validators",
      description:
        "Lists validators for a specified chain ID, including their operational status and commission rates. Supports pagination through 'limit' and 'offset' parameters. Useful for delegation operations on proof-of-stake blockchains.",
      requestParams: {
        path: requestSchema,
        query: requestParamsSchema,
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

export { chainsChainIdValidatorsOpenAPIPath, requestSchema, responseSchema };
