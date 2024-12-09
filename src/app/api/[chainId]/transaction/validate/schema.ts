import z from "zod";
import { ZodOpenApiPathsObject } from "zod-openapi";
import {
  chainIdSchema,
  checkEitherAmountOrUseMaxAmount,
  inputTransactionDataSchema,
  statusSchema,
} from "~/app/api/schemaCommon";

const pathParamsSchema = z.object({
  chainId: chainIdSchema,
});

const requestSchema = z.object({
  transaction: inputTransactionDataSchema
    // TODO: once we use Zod 4, we can move the superRefine to the amountFieldSchema above (cf: https://github.com/colinhacks/zod/issues/2474#issuecomment-2101077363)
    .superRefine((transaction, ctx) => checkEitherAmountOrUseMaxAmount(transaction.data, ctx)),
});

const responseSchema = z.object({
  status: statusSchema,
});

const transactionValidateOpenAPIPath: ZodOpenApiPathsObject = {
  "/api/{chainId}/transaction/validate": {
    post: {
      tags: ["transaction"],
      summary: "Validate a transaction",
      description:
        "Validates a transaction's format and checks it against the blockchain's current state for potential errors or warnings. This pre-validation is critical for ensuring transaction success rates and for debugging transaction issues.",
      requestParams: {
        path: pathParamsSchema,
      },
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

export { pathParamsSchema, requestSchema, responseSchema, transactionValidateOpenAPIPath };
