import { z } from "zod";
import { extendZodWithOpenApi, ZodOpenApiPathsObject } from "zod-openapi";
import { chainIdSchema } from "~/app/api/schemaCommon";
import { TransactionState } from "~/app/model/types_WIP";

extendZodWithOpenApi(z);

const requestSchema = z.object({
  chainId: chainIdSchema,
  transactionId: z.string().openapi({
    description: "Transaction ID. Usually a hash but can be different depending on the chain.",
    examples: ["559c1be45865069c6070529e43c69752d73438cbb1d04e4f301e94cd68bf7422"],
  }),
});

const responseSchema = z.object({
  chainId: chainIdSchema,
  id: z.string(),
  tokenId: z.string().optional(),
  status: z.nativeEnum(TransactionState),
  blockHeight: z.string(),
  timestamp: z.string(),
  sender: z.string(),
  recipients: z
    .object({
      address: z.string(),
      amount: z.string(),
    })
    .array(),
  fees: z.string(),
  gas: z.string().optional(),
  nonce: z.string().optional(),
  memo: z.string().optional(),
});

const chainsChainIdTransactionTransactionIdOpenAPIPath: ZodOpenApiPathsObject = {
  "/api/chains/{chainId}/transaction/{transactionId}": {
    get: {
      tags: ["chains"],
      summary: "Retrieve details of one transaction",
      description:
        "Retrieves detailed information about a specific transaction for a blockchain network, identified by chain ID and transaction ID.",
      requestParams: {
        path: requestSchema,
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
