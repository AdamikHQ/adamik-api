import z from "zod";
import { ZodOpenApiPathsObject } from "zod-openapi";
import { chainIdSchema } from "~/app/api/schemaCommon";

const requestSchema = z.object({
  chainId: chainIdSchema,
  pubkey: z.string(),
});

const responseSchema = z.string();

const addressEncodeOpenAPIPath: ZodOpenApiPathsObject = {
  "/api/address/encode": {
    post: {
      tags: ["address"],
      summary: "Get an address from a public key",
      description: "Encodes the provided public key to an address for the given chain ID",
      requestBody: {
        content: {
          "application/json": { schema: requestSchema },
        },
      },
      responses: {
        "200": {
          description: "200 OK - Returns true if the encoding is successful, otherwise false.",
          content: {
            "application/json": { schema: responseSchema },
          },
        },
      },
    },
  },
};

export { requestSchema, responseSchema, addressEncodeOpenAPIPath };
