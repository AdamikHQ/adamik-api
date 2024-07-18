import z from "zod";
import { ZodOpenApiPathsObject } from "zod-openapi";
import { inputTransactionSchema, outputTransactionSchema, transactionStatusSchema } from "../../schemaCommon";

const requestSchema = z.object({
  transaction: inputTransactionSchema.omit({ encoded: true, signature: true }),
});

const responseSchema = z.object({
  transaction: outputTransactionSchema.omit({ signature: true }).and(
    z.object({
      status: transactionStatusSchema,
    })
  ),
});

const errorResponseSchema = responseSchema.extend({
  transaction: outputTransactionSchema.omit({ encoded: true, signature: true }),
});

const transactionEncodeOpenAPIPath: ZodOpenApiPathsObject = {
  "/api/transaction/encode": {
    post: {
      tags: ["transaction"],
      summary: "Complete, validate and encode a transaction to sign",
      description:
        "Encodes transaction data into a format suitable for broadcasting. This function is pivotal for creating transactions that comply with the specific requirements of different blockchains.\
        It also completes the input transaction with computed data, such as fees and max spendable amount, and performs some chain-specific validation checks on the transaction.",
      requestBody: {
        content: {
          "application/json": { schema: requestSchema },
        },
      },
      responses: {
        "200": {
          description:
            "200 OK - Returns the transaction data encoded into a blockchain-specific format, ready for broadcasting.",
          content: {
            "application/json": { schema: responseSchema },
          },
        },
        "400": {
          description: "400 Bad Request - The transaction data is invalid",
          content: {
            "application/json": { schema: responseSchema },
          },
        },
      },
    },
  },
};

export { requestSchema, responseSchema, transactionEncodeOpenAPIPath };
