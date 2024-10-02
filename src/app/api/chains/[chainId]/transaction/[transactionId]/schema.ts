import { z } from "zod";
import { extendZodWithOpenApi, ZodOpenApiPathsObject } from "zod-openapi";
import { bigintToStringSchema, chainIdSchema, statusSchema } from "~/app/api/schemaCommon";
import { deepBigintToString } from "~/app/tools/convertors/deepBigintToString";

extendZodWithOpenApi(z);

const pathParamsSchema = z.object({
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

// TODO: wrap raw & parsed inside transaction object ?
const responseSchema = z
  .object({
    raw: z
      .any()
      .transform((data) => deepBigintToString(data)) // FIXME: remove this once we have a better way to handle raw transactions
      .pipe(z.unknown()),
    parsed: z
      .object({
        chainId: chainIdSchema,
        id: z.string(),
        tokenId: z.string().optional(),
        blockHeight: bigintToStringSchema.optional(),
        timestamp: z
          .number()
          .pipe(z.coerce.string())
          .openapi({
            description: "Timestamp in milliseconds",
          })
          .optional(),
        senders: z
          .object({
            address: z.string(),
          })
          .array(),
        recipients: z
          .object({
            address: z.string(),
            amount: bigintToStringSchema,
          })
          .array()
          .optional(),
        fees: bigintToStringSchema,
        gas: bigintToStringSchema.optional(),
        nonce: bigintToStringSchema.optional(),
        memo: z.string().optional(),
      })
      .optional(),
  })
  .merge(statusSchema);

const chainsChainIdTransactionTransactionIdOpenAPIPath: ZodOpenApiPathsObject = {
  "/api/chains/{chainId}/transaction/{transactionId}": {
    get: {
      tags: ["chains"],
      summary: "Retrieve details of one transaction",
      description:
        "Retrieves detailed information about a specific transaction for a blockchain network, identified by chain ID and transaction ID.",
      requestParams: {
        path: pathParamsSchema,
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

export { chainsChainIdTransactionTransactionIdOpenAPIPath, pathParamsSchema, responseSchema };
