import { z } from "zod";
import { extendZodWithOpenApi, ZodOpenApiPathsObject } from "zod-openapi";
import { chainIdSchemaParams, tokenSchema } from "~/app/api/schemaCommon";
import { CHAINS } from "~/app/config/chains";
import { ChainId } from "~/app/model/types_WIP";

extendZodWithOpenApi(z);

const supportedChainIds = Object.values(CHAINS)
  .filter((chain) => chain.supportedFeatures.read.token)
  .map((chain) => chain.id);

const supportedChainIdsSchema = z.enum(supportedChainIds as [ChainId, ...ChainId[]], chainIdSchemaParams);

const pathParamsSchema = z.object({
  chainId: supportedChainIdsSchema,
  tokenId: z.string().openapi({
    description: "Token ID. Format depends on the chain, e.g. contract address for EVM chains.",
    examples: ["0xdAC17F958D2ee523a2206206994597C13D831ec7"],
  }),
});
const responseSchema = tokenSchema;

const chainsChainIdTokenTokenIdOpenAPIPath: ZodOpenApiPathsObject = {
  "/api/chains/{chainId}/token/{tokenId}": {
    get: {
      tags: ["chains"],
      summary: "Get Token Details",
      description:
        "Retrieves detailed information about a specific token for a blockchain network, identified by chain ID and token ID.",
      requestParams: {
        path: pathParamsSchema,
      },
      responses: {
        "200": {
          description:
            "200 OK - Successfully returns detailed data about the token on the specified blockchain.",
          content: {
            "application/json": { schema: responseSchema },
          },
        },
      },
    },
  },
};

export { chainsChainIdTokenTokenIdOpenAPIPath, pathParamsSchema, responseSchema };
