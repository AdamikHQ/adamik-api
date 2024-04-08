import z from "zod";
import { ZodOpenApiPathsObject } from "zod-openapi";

export const getDataValidators = z.object({
  limit: z.number().optional(),
  offset: z.number().optional(),
  chainId: z.string(),
});

export const getDataValidatorsResponse = z.object({
  address: z.string(),
  name: z.string(),
  logo: z.string().optional(),
  website: z.string(),
  status: z.string(),
  commission: z.number(),
  maxCommission: z.number().optional(),
  raw: z.unknown(),
});

export const dataValidatorsSchemaConfig: ZodOpenApiPathsObject = {
  "/api/data/validators": {
    get: {
      requestParams: {
        query: getDataValidators,
      },
      responses: {
        "200": {
          description: "200 OK",
          content: {
            "application/json": { schema: getDataValidatorsResponse },
          },
        },
      },
    },
  },
};
