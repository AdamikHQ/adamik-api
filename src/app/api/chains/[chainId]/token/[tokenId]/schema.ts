import { z } from "zod";
import { extendZodWithOpenApi, ZodOpenApiPathsObject } from "zod-openapi";
import { ChainId, TokenType } from "../../../../../model/types_WIP";

extendZodWithOpenApi(z);

const requestSchema = z.object({
  chainId: z.string().openapi({
    description: "Chain ID",
    example: "ethereum",
  }),
  tokenId: z.string().openapi({
    description: "Token ID. Format depends on the chain, e.g. contract address for EVM chains.",
    example: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
  }),
});

const responseSchema = z.object({
  chainId: z.nativeEnum(ChainId),
  type: z.nativeEnum(TokenType),
  id: z.string(),
  name: z.string(),
  ticker: z.string(),
  decimals: z.string(),
  contractAddress: z.string().optional(),
});

const chainsChainIdTokenTokenIdOpenAPIPath: ZodOpenApiPathsObject = {
  "/api/chains/{chainId}/token/{tokenId}": {
    get: {
      tags: ["chains"],
      description:
        "Retrieves detailed information about a specific token for a blockchain network, identified by chain ID and token ID.",
      requestParams: {
        path: requestSchema,
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

export { requestSchema, responseSchema, chainsChainIdTokenTokenIdOpenAPIPath };
