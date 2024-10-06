import { z } from "zod";
import { extendZodWithOpenApi, ZodOpenApiPathsObject } from "zod-openapi";
import { chainIdSchema, finalizedTransactionSchema } from "~/app/api/schemaCommon";

extendZodWithOpenApi(z);

const requestSchema = z.object({
  chainId: chainIdSchema,
  transactionId: z.string().openapi({
    description: "Transaction ID. Usually a hash but can be different depending on the chain.",
    examples: ["559c1be45865069c6070529e43c69752d73438cbb1d04e4f301e94cd68bf7422"],
  }),
});

const requestParamsSchema = z.object({
  include: z
    .union([
      z.literal("parsed").openapi({
        description:
          "Include parsed fields in the standard Adamik format. Note that all transactions types may not be available for this option.",
      }),
      z.literal("raw").openapi({
        description: "Include the raw transaction as provided in native format by the blockchain.",
      }),
    ])
    .optional()
    .openapi({
      description: "Optional filter, to let you request only the data that you need.",
    }),
});

const responseSchema = finalizedTransactionSchema;

const chainsChainIdTransactionTransactionIdOpenAPIPath: ZodOpenApiPathsObject = {
  "/api/chains/{chainId}/transaction/{transactionId}": {
    get: {
      tags: ["chains"],
      summary: "Retrieve details of one transaction",
      description:
        "Retrieves detailed information about a specific transaction for a blockchain network, identified by chain ID and transaction ID.",
      requestParams: {
        path: requestSchema,
        query: requestParamsSchema,
      },
      responses: {
        "200": {
          description:
            "200 OK - Successfully returns detailed data about the transaction on the specified blockchain.",
          content: {
            "application/json": { schema: responseSchema },
          },
        },
      },
    },
  },
};

export { chainsChainIdTransactionTransactionIdOpenAPIPath, requestSchema, responseSchema };
