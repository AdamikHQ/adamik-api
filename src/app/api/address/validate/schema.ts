import z from "zod";
import { ZodOpenApiPathsObject } from "zod-openapi";
import { CHAINS } from "~/app/config/chains";
import { ChainId } from "~/app/model/types_WIP";

const supportedChainIds = Object.values(CHAINS)
  .filter(
    (chain) =>
      chain.supportedFeatures.write.transaction.type.native ||
      chain.supportedFeatures.write.transaction.type.tokens ||
      chain.supportedFeatures.write.transaction.type.staking
  )
  .map((chain) => chain.id);

const supportedChainIdsSchema = z.enum(supportedChainIds as [ChainId, ...ChainId[]]);

const requestSchema = z.object({
  chainId: supportedChainIdsSchema,
  address: z.string(),
});

const responseSchema = z.boolean();

const addressValidateOpenAPIPath: ZodOpenApiPathsObject = {
  "/api/address/validate": {
    post: {
      tags: ["address"],
      summary: "Validate an address",
      description:
        "Validates the specified address for the given chain ID, returning true if the address is valid, otherwise false.",
      requestBody: {
        content: {
          "application/json": { schema: requestSchema },
        },
      },
      responses: {
        "200": {
          description:
            "200 OK - Returns true if the address is valid for the specified chain ID, otherwise false.",
          content: {
            "application/json": { schema: responseSchema },
          },
        },
      },
    },
  },
};

export { addressValidateOpenAPIPath, requestSchema, responseSchema };
