import { ZodOpenApiPathsObject } from "zod-openapi";
import { plainTransactionSchema, transactionSchema } from "../../utils/zodCommon";

export const postTransactionEncode = plainTransactionSchema;

export const postTransactionEncodeResponse = transactionSchema;

export const transactionEncodeConfig: ZodOpenApiPathsObject = {
  "/api/transaction/encode": {
    post: {
      requestBody: {
        content: {
          "application/json": { schema: postTransactionEncode },
        },
      },
      responses: {
        "200": {
          description: "200 OK",
          content: {
            "application/json": { schema: postTransactionEncodeResponse },
          },
        },
      },
    },
  },
};
