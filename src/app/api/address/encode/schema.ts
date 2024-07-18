import z from "zod";
import { ZodOpenApiPathsObject } from "zod-openapi";
import { chainIdSchema } from "~/app/api/schemaCommon";

const requestSchema = z.object({
  chainId: chainIdSchema,
  pubkey: z.string(),
});

const responseSchema = z
  .object({
    type: z.string(),
    address: z.string(),
  })
  .array();

const addressEncodeOpenAPIPath: ZodOpenApiPathsObject = {
  "/api/address/encode": {
    post: {
      tags: ["address"],
      summary: "Get addresses from a public key",
      description:
        'Encodes the provided public key to one or multiple addresses, for the given chain ID. \
      Each address is labeled with a type, which may be "default" when there is only one address.',
      requestBody: {
        content: {
          "application/json": { schema: requestSchema },
        },
      },
      responses: {
        "200": {
          description: "200 OK - Returns true if the encoded result",
          content: {
            "application/json": { schema: responseSchema },
          },
        },
      },
    },
  },
};

export { addressEncodeOpenAPIPath, requestSchema, responseSchema };
