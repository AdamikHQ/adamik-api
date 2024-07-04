import z from "zod";
import { ZodOpenApiPathsObject } from "zod-openapi";
import { transactionDataSchema } from "~/app/api/schemaCommon";

const requestSchema = z.object({
  transaction:
    z.object({
      encoded: z.string().or(z.object({})),
      signature: z.string(),
    }).and(
      // TODO: should be replaced by data field
      z.object({
        plain: transactionDataSchema,
      }).openapi({
        deprecated: true,
      }).or(z.object({
        data: transactionDataSchema
      })).transform((object) => {
        if ('plain' in object) {
          return {
            data: object.plain,
            ...object
          }
        }
      }),
    ),
});

const responseSchema = z.union([
  z.object({ hash: z.string() }),
  z.object({
    error: z.object({
      message: z.string(),
    }),
  }),
]);

const transactionBroadcastOpenAPIPath: ZodOpenApiPathsObject = {
  "/api/transaction/broadcast": {
    post: {
      tags: ["transaction"],
      description:
        "Broadcasts a signed transaction to the blockchain, crucial for submitting transactions like transfers, delegations, or reward claims. Returns a transaction receipt (hash) or error details.",
      requestBody: {
        content: {
          "application/json": { schema: requestSchema },
        },
      },
      responses: {
        "200": {
          description: "200 OK - Returns a transaction receipt or error details if the transaction fails.",
          content: {
            "application/json": { schema: responseSchema },
          },
        },
      },
    },
  },
};

export { requestSchema, responseSchema, transactionBroadcastOpenAPIPath };
