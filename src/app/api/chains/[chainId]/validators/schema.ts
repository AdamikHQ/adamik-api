import z from "zod";
import { ZodOpenApiPathsObject } from "zod-openapi";
import { CHAINS } from "~/app/config/chains";
import { ChainId } from "~/app/model/types_WIP";

const supportedChainIds = Object.values(CHAINS)
  .filter((chain) => chain.supportedFeatures.read.transaction.staking)
  .map((chain) => chain.id);

const supportedChainIdsSchema = z.enum(supportedChainIds as [ChainId, ...ChainId[]]);

const pathParamsSchema = z.object({
  chainId: supportedChainIdsSchema,
});

const queryParamsSchema = z.object({
  offset: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
});

const responseSchema = z.object({
  chainId: supportedChainIdsSchema,
  validators: z
    .object({
      address: z.string(),
      name: z.string(),
      commission: z.number().optional(),
    })
    .array(),
});

const chainsChainIdValidatorsOpenAPIPath: ZodOpenApiPathsObject = {
  "/api/chains/{chainId}/validators": {
    get: {
      tags: ["chains"],
      summary: "Retrieve the list of existing validators",
      description:
        "Lists validators for a specified chain ID, including their operational status and commission rates. Supports pagination through 'limit' and 'offset' parameters. Useful for delegation operations on proof-of-stake blockchains.",
      requestParams: {
        path: pathParamsSchema,
        query: queryParamsSchema,
      },
      responses: {
        "200": {
          description:
            "200 OK - Returns a list of validators, their status, and commission details for the specified chain ID.",
          content: {
            "application/json": { schema: responseSchema },
          },
        },
      },
    },
  },
};

export { chainsChainIdValidatorsOpenAPIPath, pathParamsSchema, queryParamsSchema, responseSchema };
