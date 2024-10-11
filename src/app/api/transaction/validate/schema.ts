import z from "zod";
import { ZodOpenApiPathsObject } from "zod-openapi";
import {
  inputTransactionDataSchema,
  outputTransactionDataSchema,
  statusSchema,
} from "~/app/api/schemaCommon";

const requestSchema = z.object({
  transaction: inputTransactionDataSchema,
});

const responseSchema = z.object({
  transaction: outputTransactionDataSchema,
  status: statusSchema,
});

const transactionValidateOpenAPIPath: ZodOpenApiPathsObject = {
  "/api/transaction/validate": {
    post: {
      tags: ["transaction"],
      summary: "Validate a transaction",
      description:
        "Validates a transaction's format and checks it against the blockchain's current state for potential errors or warnings. This pre-validation is critical for ensuring transaction success rates and for debugging transaction issues.",
      requestBody: {
        content: {
          "application/json": { schema: requestSchema },
        },
      },
      responses: {
        "200": {
          description:
            "200 OK - Provides validation results, including any errors or warnings related to the transaction.",
          content: {
            "application/json": { schema: responseSchema },
          },
        },
      },
    },
  },
};

export { requestSchema, responseSchema, transactionValidateOpenAPIPath };
