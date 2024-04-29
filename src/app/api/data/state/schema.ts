import z from "zod";
import { ZodOpenApiPathsObject } from "zod-openapi";

const requestSchema = z.object({
  chainId: z.string().min(1),
  address: z.string().min(1),
});

const responseSchema = z.object({
  balances: z.object({ available: z.string() }),
});

const dataStateOpenAPIPath: ZodOpenApiPathsObject = {
  "/api/data/state": {
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

export { requestSchema, responseSchema, dataStateOpenAPIPath };
