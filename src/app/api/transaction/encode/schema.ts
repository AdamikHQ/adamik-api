import z from "zod";
import { ZodOpenApiPathsObject } from "zod-openapi";
import {
  checkEitherAmountOrUseMaxAmount,
  encodedTransactionSchema,
  inputTransactionDataSchema,
  outputTransactionDataSchema,
  statusSchema,
} from "../../schemaCommon";

const requestSchema = z.object({
  transaction: inputTransactionDataSchema
    // TODO: once we use Zod 4, we can move the superRefine to the amountFieldSchema above (cf: https://github.com/colinhacks/zod/issues/2474#issuecomment-2101077363)
    .superRefine((transaction, ctx) => checkEitherAmountOrUseMaxAmount(transaction.data, ctx)),
});

const responseSchema = z.object({
  transaction: outputTransactionDataSchema.merge(encodedTransactionSchema),
  status: statusSchema,
});

const errorResponseSchema = responseSchema.extend({
  transaction: outputTransactionDataSchema,
  status: statusSchema,
});

const transactionEncodeOpenAPIPath: ZodOpenApiPathsObject = {
  "/api/transaction/encode": {
    post: {
      tags: ["transaction"],
      summary: "Encode a Transaction",
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
            "application/json": { schema: errorResponseSchema },
          },
        },
      },
    },
  },
};

export { requestSchema, responseSchema, transactionEncodeOpenAPIPath };
