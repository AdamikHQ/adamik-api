import z from "zod";
import { ZodOpenApiPathsObject } from "zod-openapi";
import { chainIdSchema } from "~/app/api/schemaCommon";

const pathParamsSchema = z.object({
  chainId: chainIdSchema,
});

const requestSchema = z.object({
  pubkey: z.string(),
});

const responseSchema = z.object({
  chainId: chainIdSchema,
  pubkey: z.string(),
  addresses: z
    .object({
      type: z.string(),
      address: z.string(),
    })
    .array(),
});

const addressEncodeOpenAPIPath: ZodOpenApiPathsObject = {
  "/api/{chainId}/address/encode": {
    post: {
      tags: ["Utils"],
      summary: "Pubkey to Address",
      description:
        'Encodes the provided public key to one or multiple addresses, for the given chain ID. \
      Each address is labeled with a type, which may be "default" when there is only one address.',
      requestBody: {
        content: {
          "application/json": { schema: requestSchema },
        },
      },
      requestParams: {
        path: pathParamsSchema,
      },
      responses: {
        "200": {
          description: "Returns a set of addresses, one for each supported type, depending on the chain",
          content: {
            "application/json": { schema: responseSchema },
          },
        },
      },
    },
  },
};

export { addressEncodeOpenAPIPath, pathParamsSchema, requestSchema, responseSchema };
