import z from "zod";
import { ZodOpenApiPathsObject } from "zod-openapi";
import { plainTransactionSchema, transactionStatusSchema } from "~/app/api/schemaCommon";

const requestSchema = z.object({
  transaction: z.object({
    plain: plainTransactionSchema,
  }),
});

const responseSchema = transactionStatusSchema;

const transactionValidateOpenAPIPath: ZodOpenApiPathsObject = {
  "/api/transaction/validate": {
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

export { requestSchema, responseSchema, transactionValidateOpenAPIPath };
