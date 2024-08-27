import z from "zod";
import { ZodOpenApiPathsObject } from "zod-openapi";
import { transactionSchema, transactionStatusSchema } from "../../schemaCommon";

const requestSchema = z.object({
  transaction: transactionSchema,
});

const responseSchema = z.object({
  transaction: transactionSchema
    .and(
      z.object({
        encoded: z.string(),
      })
    )
    .and(
      z.object({
        status: transactionStatusSchema,
      })
    ),
});

const transactionEncodeOpenAPIPath: ZodOpenApiPathsObject = {
  "/api/transaction/encode": {
    post: {
      tags: ["transaction"],
      summary: "Complete, validate and encode a transaction to sign",
      description:
        "Encodes transaction data into a format suitable for broadcasting. This function is pivotal for creating transactions that comply with the specific requirements of different blockchains.",
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
      },
    },
  },
};

export { requestSchema, responseSchema, transactionEncodeOpenAPIPath };
