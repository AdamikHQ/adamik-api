import z from "zod";
import { ZodOpenApiPathsObject } from "zod-openapi";
import { ChainId } from "~/app/model/types_WIP";
import { chainIdSchema } from "~/app/api/schemaCommon";

const requestSchema = z.object({
  chainId: chainIdSchema,
  pubkey: z.string(),
});

const responseSchema = z.boolean();

const addressEncodeOpenAPIPath: ZodOpenApiPathsObject = {
  "/api/address/encode": {
    post: {
      tags: ["address"],
      description:
        "Encodes the public key based on the specified chain ID and returns true if the operation is successful, otherwise false.",
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
