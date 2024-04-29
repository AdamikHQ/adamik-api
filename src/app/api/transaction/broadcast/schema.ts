import z from "zod";
import { ZodOpenApiPathsObject } from "zod-openapi";
import { plainTransactionSchema } from "~/app/api/schemaCommon";

const requestSchema = z.object({
  transaction: z.object({
    plain: plainTransactionSchema,
    encoded: z.string().or(z.object({})),
    signature: z.string(),
  }),
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
      requestBody: {
        content: {
          "application/json": { schema: requestSchema },
        },
      },
      responses: {
        "200": {
          description: "200 OK",
          content: {
            "application/json": { schema: responseSchema },
          },
        },
      },
    },
  },
};

export { requestSchema, responseSchema, transactionBroadcastOpenAPIPath };
