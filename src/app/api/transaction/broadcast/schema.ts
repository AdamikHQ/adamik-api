import { ZodOpenApiPathsObject } from "zod-openapi";
import { plainTransactionSchema, transactionSchema } from "../../utils/zodCommon";

export const postTransactionBroadcast = plainTransactionSchema;

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
