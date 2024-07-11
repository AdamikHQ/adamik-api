import z from "zod";
import { ZodOpenApiPathsObject } from "zod-openapi";
import { plainTransactionSchema } from "~/app/api/schemaCommon";

const requestSchema = z.object({
  transaction: z.object({
    plain: plainTransactionSchema,
  }),
});

const responseSchema = z.object({
  transaction: z.object({
    plain: plainTransactionSchema,
    encoded: z.string(),
  }),
});

const errorResponseSchema = z.object({
  transaction: z.object({
    plain: plainTransactionSchema,
  }),
});

const transactionEncodeOpenAPIPath: ZodOpenApiPathsObject = {
  "/api/transaction/encode": {
    post: {
      tags: ["transaction"],
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
        "400": {
          description:
            "400 Bad Request - The transaction data is invalid",
          content: {
            "application/json": { schema: errorResponseSchema },
          },
        },
      },
    },
  },
};

export { requestSchema, responseSchema, errorResponseSchema, transactionEncodeOpenAPIPath };
