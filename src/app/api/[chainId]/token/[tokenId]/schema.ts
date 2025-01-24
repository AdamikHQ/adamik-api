import { z } from "zod";
import { ZodOpenApiPathsObject } from "zod-openapi";
import "zod-openapi/extend";
import { getSupportedChainIdsSchema, tokenSchema } from "~/app/api/schemaCommon";
import { CHAINS } from "~/app/config/chains";
import { chainSupports } from "~/app/tools/features";
import { ChainFeatures } from "~/app/model/types_WIP";

// FIXME: When we land on the way to go forward with supported features, we can decide how we want to
//        implement this test. For now, I made a `chainSupports(chain, features)` function
const supportedChainIds = Object.values(CHAINS)
  .filter((chain) => chainSupports(chain, [ChainFeatures.READ__TOKENS]))
  .map((chain) => chain.id);

const pathParamsSchema = z.object({
  chainId: getSupportedChainIdsSchema(supportedChainIds),
  tokenId: z.string().openapi({
    description: "Token ID. Format depends on the chain, e.g. contract address for EVM chains.",
    examples: ["0xdAC17F958D2ee523a2206206994597C13D831ec7"],
  }),
});

const responseSchema = z.object({
  token: tokenSchema,
});

const tokenOpenAPIPath: ZodOpenApiPathsObject = {
  "/api/{chainId}/token/{tokenId}": {
    get: {
      tags: ["Chain"],
      summary: "Get Token Details",
      description:
        "Retrieves detailed information about a specific token for a blockchain network, identified by chain ID and token ID.",
      requestParams: {
        path: pathParamsSchema,
      },
      responses: {
        "200": {
          description: "Returns detailed data about the token on the specified blockchain.",
          content: {
            "application/json": { schema: responseSchema },
          },
        },
      },
    },
  },
};

export { pathParamsSchema, responseSchema, tokenOpenAPIPath };
