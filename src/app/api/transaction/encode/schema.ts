import z from "zod";
import { ZodOpenApiPathsObject } from "zod-openapi";
import { transactionDataSchema } from "~/app/api/schemaCommon";

const requestSchema = z.object({
  transaction:
    // TODO: should be replaced by data field
    z.union([
      z.object({
        plain: transactionDataSchema,
      }).openapi({
        deprecated: true,
      }),
      z.object({
        data: transactionDataSchema
      })
    ]).transform((object) => {
      if ('plain' in object) {
        return {
          data: object.plain,
        };
      }
      return object;
    }),
});

const responseSchema = z.object({
  transaction: z.object({
    // TODO: should be replaced by data field
    plain: transactionDataSchema.openapi({ deprecated: true }),
    data: transactionDataSchema,
    encoded: z.string(),
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
      },
    },
  },
};

export { requestSchema, responseSchema, transactionEncodeOpenAPIPath };
