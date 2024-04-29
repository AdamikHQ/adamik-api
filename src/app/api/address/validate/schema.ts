import z from "zod";
import { ZodOpenApiPathsObject } from "zod-openapi";

const requestSchema = z.object({
  chainId: z.string(),
  address: z.string(),
});

const responseSchema = z.boolean();

const addressValidateOpenAPIPath: ZodOpenApiPathsObject = {
  "/api/address/validate": {
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

export { requestSchema, responseSchema, addressValidateOpenAPIPath };
