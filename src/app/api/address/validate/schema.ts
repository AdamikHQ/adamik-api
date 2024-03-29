import z from "zod";
import { ZodOpenApiPathsObject } from "zod-openapi";

const postAddressValidateSchemaRequest = z.object({
  chainId: z.string(),
  address: z.string(),
});

export const addressValidateConfig: ZodOpenApiPathsObject = {
  "/api/address/validate": {
    post: {
      requestBody: {
        content: {
          "application/json": { schema: postAddressValidateSchemaRequest },
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
