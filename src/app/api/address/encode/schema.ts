import z from "zod";
import { ZodOpenApiPathsObject } from "zod-openapi";

const requestSchema = z.object({
  chainId: z.string(),
  pubkey: z.string(),
});

const responseSchema = z.boolean();

const addressEncodeOpenAPIPath: ZodOpenApiPathsObject = {
  "/api/address/encode": {
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

export { requestSchema, responseSchema, addressEncodeOpenAPIPath };
