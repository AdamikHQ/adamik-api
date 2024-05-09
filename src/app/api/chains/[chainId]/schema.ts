import { z } from "zod";
import { extendZodWithOpenApi, ZodOpenApiPathsObject } from "zod-openapi";
import { chainIdSchema, unitSchema, backendsSchema } from "~/app/api/schemaCommon";

extendZodWithOpenApi(z);

const requestSchema = z.object({
  chainId: z.string().openapi({
    description: "Chain ID",
    example: "cosmoshub",
  }),
});

const responseSchema = z.object({
  id: chainIdSchema,
  name: z.string(),
  family: z.string(),
  units: z.array(unitSchema),
  backends: backendsSchema, // FIXME Should be part of the response (need proper DTOs)
  params: z.any().optional(),
});

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

export { chainsChainIdOpenAPIPath };
