import z from "zod";
import { ZodOpenApiPathsObject } from "zod-openapi";
import { CHAINS } from "~/app/config/chains";

const supportedChainIds = Object.values(CHAINS)
  .filter(
    (chain) =>
      chain.supportedFeatures.write.transaction.type.native ||
      chain.supportedFeatures.write.transaction.type.tokens ||
      chain.supportedFeatures.write.transaction.type.staking
  )
  .map((chain) => chain.id);

const supportedChainIdsSchema = z.enum(supportedChainIds as [string, ...string[]]);

const requestSchema = z.object({
  chainId: supportedChainIdsSchema,
  pubkey: z.string(),
});

const responseSchema = z.object({
  chainId: supportedChainIdsSchema,
  pubkey: z.string(),
  addresses: z
    .object({
      type: z.string(),
      address: z.string(),
    })
    .array(),
});

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
