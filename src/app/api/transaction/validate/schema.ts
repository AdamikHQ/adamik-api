import z from "zod";
import { ZodOpenApiPathsObject } from "zod-openapi";
import { plainTransactionSchema, transactionStatusSchema } from "~/app/api/utils/zodCommon";

const requestSchema = z.object({
  transaction: z.object({
    plain: plainTransactionSchema,
  }),
});

const responseSchema = transactionStatusSchema;

const transactionValidateOpenAPIPath: ZodOpenApiPathsObject = {
  "/api/transaction/validate": {
    post: {
      description: "Validates a transaction's format and checks it against the blockchain's current state for potential errors or warnings. This pre-validation is critical for ensuring transaction success rates and for debugging transaction issues.",
      requestBody: {
        content: {
          "application/json": { schema: requestSchema },
        },
      },
      responses: {
        "200": {
          description: "200 OK - Provides validation results, including any errors or warnings related to the transaction.",
          content: {
            "application/json": { schema: responseSchema },
          },
        },
      },
    },
  },
};

export { requestSchema, responseSchema, transactionValidateOpenAPIPath };
