import z from "zod";
import { ZodOpenApiPathsObject } from "zod-openapi";
import { chainIdSchema } from "~/app/api/schemaCommon";

const requestSchema = z.object({
  chainId: chainIdSchema,
  pubkey: z.string(),
});

const responseSchema = z.record(z.string(), z.string());

const addressEncodeOpenAPIPath: ZodOpenApiPathsObject = {
  "/api/addresses/encode": {
    post: {
      tags: ["addresses"],
      summary: "Get addresses from a public key",
      description: "Encodes the provided public key to addresses for the given chain ID",
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

export { addressEncodeOpenAPIPath, requestSchema, responseSchema };
