import z from "zod";
import { ZodOpenApiPathsObject } from "zod-openapi";
import {
  inputTransactionDataSchema,
  outputTransactionDataSchema,
  signedAndEncodedTransactionSchema,
  statusSchema,
} from "../../schemaCommon";

const requestSchema = z.object({
  transaction: inputTransactionDataSchema.and(signedAndEncodedTransactionSchema),
});

const responseSchema = z.object({
  hash: z.string().optional(),
  transaction: outputTransactionDataSchema,
  status: statusSchema,
});

const transactionBroadcastOpenAPIPath: ZodOpenApiPathsObject = {
  "/api/transaction/broadcast": {
    post: {
      tags: ["transaction"],
      summary: "Broadcast Transaction",
      description:
        "Broadcasts a signed transaction to the blockchain, crucial for submitting transactions like transfers, delegations, or reward claims. Returns a transaction receipt (hash) or error details.",
      requestBody: {
        content: {
          "application/json": { schema: requestSchema },
        },
      },
      responses: {
        "200": {
          description: "200 OK - Returns a transaction receipt or error details if the transaction fails.",
          content: {
            "application/json": { schema: responseSchema },
          },
        },
      },
    },
  },
};

export { requestSchema, responseSchema, transactionBroadcastOpenAPIPath };
