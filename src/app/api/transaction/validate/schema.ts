import { ZodOpenApiPathsObject } from "zod-openapi";
import { plainTransactionSchema, transactionStatusSchema } from "../../utils/zodCommon";

export const postTransactionValidate = plainTransactionSchema;

export const postTransactionValidateResponse = transactionStatusSchema;

export const transactionValidateConfig: ZodOpenApiPathsObject = {
  "/api/transaction/validate": {
    post: {
      requestBody: {
        content: {
          "application/json": { schema: postTransactionValidate },
        },
      },
      responses: {
        "200": {
          description: "200 OK",
          content: {
            "application/json": { schema: postTransactionValidateResponse },
          },
        },
      },
    },
  },
};
