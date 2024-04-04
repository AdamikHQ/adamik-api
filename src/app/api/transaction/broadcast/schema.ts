import { ZodOpenApiPathsObject } from "zod-openapi";
import { plainTransactionSchema, transactionSchema } from "../../utils/zodCommon";
import z from "zod";

export const postTransactionBroadcast = z.object({
  signature: z.string(),
  plain: plainTransactionSchema,
  format: z.string().optional(),
  pubKey: z.string().optional()
});

export const postTransactionBroadcastResponse = transactionSchema;

export const transactionBroadcastConfig: ZodOpenApiPathsObject = {
  "/api/transaction/broadcast": {
    post: {
      requestBody: {
        content: {
          "application/json": { schema: postTransactionBroadcast },
        },
      },
      responses: {
        "200": {
          description: "200 OK",
          content: {
            "application/json": { schema: postTransactionBroadcastResponse },
          },
        },
      },
    },
  },
};
