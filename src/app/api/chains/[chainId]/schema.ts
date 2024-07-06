import { z } from "zod";
import { ZodOpenApiPathsObject } from "zod-openapi";
import { chainIdSchema, chainSchema } from "~/app/api/schemaCommon";

const requestSchema = z.object({
  chainId: chainIdSchema,
});

const responseSchema = chainSchema;

const chainsChainIdOpenAPIPath: ZodOpenApiPathsObject = {
  "/api/chains/{chainId}": {
    get: {
      tags: ["chains"],
      description:
        "Retrieves detailed information about a specific blockchain network identified by chain ID.",
      requestParams: {
        path: requestSchema,
      },
      responses: {
        "200": {
          description:
            "200 OK - Successfully returns detailed data about the specified blockchain, including its identifier, name, family classification, supported units of currency, and additional configuration parameters.",
          content: {
            "application/json": { schema: responseSchema },
          },
        },
      },
    },
  },
};

export { chainsChainIdOpenAPIPath, requestSchema };
