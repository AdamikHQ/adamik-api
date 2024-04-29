import z from "zod";
import { ZodOpenApiPathsObject } from "zod-openapi";
import { plainTransactionSchema } from "~/app/api/utils/zodCommon";

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

const transactionEncodeOpenAPIPath: ZodOpenApiPathsObject = {
  "/api/transaction/encode": {
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

export { requestSchema, responseSchema, transactionEncodeOpenAPIPath };
