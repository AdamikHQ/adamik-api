import z from "zod";
import { ZodOpenApiPathsObject } from "zod-openapi";
import { transactionSchema } from "../txSchemaCommon";

const requestSchema = z.object({
  transaction: transactionSchema.and(
    z.object({
      encoded: z.string().or(z.any()),
      signature: z.string(),
    })
  ),
});

const responseSchema = z.union([
  z.object({ hash: z.string() }),
  z.object({
    error: z.object({
      message: z.string(),
    }),
  }),
]);

const transactionBroadcastOpenAPIPath: ZodOpenApiPathsObject = {
  "/api/transaction/broadcast": {
    post: {
      tags: ["transaction"],
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
