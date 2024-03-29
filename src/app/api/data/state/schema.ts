import z from "zod";
import { ZodOpenApiPathsObject } from "zod-openapi";

export const postDataStateSchema = z.object({
  chainId: z.string().min(1),
  address: z.string().min(1),
});

export const postDataStateSchemaResponse = z.object({
  balances: z.object({ available: z.string() }),
});

export const dataStateSchemaConfig: ZodOpenApiPathsObject = {
  "/api/data/state": {
    post: {
      requestBody: {
        content: {
          "application/json": { schema: postDataStateSchema },
        },
      },
      responses: {
        "200": {
          description: "200 OK",
          content: {
            "application/json": { schema: postDataStateSchemaResponse },
          },
        },
      },
    },
  },
};
