import z from "zod";
import { ZodOpenApiPathsObject } from "zod-openapi";
import { paginationSchema } from "~/app/api/schemaCommon";

const requestSchema = z.object({
  chainId: z.string(),
  pagination: paginationSchema.optional(),
});

const responseSchema = z.object({
  chainId: z.string(), // FIXME Update after https://github.com/AdamikHQ/adamik/pull/47 is merged
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
    post: {
      tags: ["chains"],
      description:
        "Lists validators for a specified chain ID, including their operational status and commission rates. Supports pagination through 'limit' and 'offset' parameters. Useful for delegation operations on proof-of-stake blockchains.",
      requestBody: {
        content: {
          "application/json": { schema: requestSchema },
        },
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

export { requestSchema, responseSchema, chainsChainIdValidatorsOpenAPIPath };
