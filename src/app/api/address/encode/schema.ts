import z from "zod";
import { ZodOpenApiPathsObject } from "zod-openapi";

const postAddressEncodeSchemaRequest = z.object({
  chainId: z.string(),
  pubkey: z.string(),
});

export const addressEncodeConfig: ZodOpenApiPathsObject = {
  "/api/address/encode": {
    post: {
      requestBody: {
        content: {
          "application/json": { schema: postAddressEncodeSchemaRequest },
        },
      },
      responses: {
        "200": {
          description: "200 OK",
          content: {
            "application/json": { schema: z.boolean() },
          },
        },
      },
    },
  },
};
