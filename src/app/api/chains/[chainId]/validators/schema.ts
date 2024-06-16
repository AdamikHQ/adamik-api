import z from "zod";
import { ZodOpenApiPathsObject } from "zod-openapi";

const requestSchema = z.object({
  chainId: z.string(),
  limit: z.number().optional(),
  offset: z.number().optional(),
});

const responseSchema = z.object({
  address: z.string(),
  name: z.string(),
  logo: z.string().optional(),
  website: z.string(),
  status: z.string(),
  commission: z.number(),
  maxCommission: z.number().optional(),
  raw: z.unknown(),
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
