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

const dataValidatorsOpenAPIPath: ZodOpenApiPathsObject = {
  "/api/data/validators": {
    post: {
      requestBody: {
        content: {
          "application/json": { schema: requestSchema },
        },
      },
      responses: {
        "200": {
          description: "200 OK",
          content: {
            "application/json": { schema: responseSchema },
          },
        },
      },
    },
  },
};

export { requestSchema, responseSchema, dataValidatorsOpenAPIPath };
