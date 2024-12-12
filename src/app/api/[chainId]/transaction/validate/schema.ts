import z from "zod";
import { ZodOpenApiPathsObject } from "zod-openapi";
import {
  checkEitherAmountOrUseMaxAmount,
  getSupportedChainIdsSchema,
  inputTransactionDataSchema,
  statusSchema,
} from "~/app/api/schemaCommon";
import { CHAINS } from "~/app/config/chains";

const supportedChainIds = Object.values(CHAINS)
  .filter(
    (chain) =>
      chain.supportedFeatures.write.transaction.type.native ||
      chain.supportedFeatures.write.transaction.type.tokens ||
      chain.supportedFeatures.write.transaction.type.staking
  )
  .map((chain) => chain.id);

const pathParamsSchema = z.object({
  chainId: getSupportedChainIdsSchema(supportedChainIds),
});

const requestSchema = z.object({
  transaction: inputTransactionDataSchema
    // TODO: once we use Zod 4, we can move the superRefine to the amountFieldSchema (cf: https://github.com/colinhacks/zod/issues/2474#issuecomment-2101077363)
    .superRefine((transaction, ctx) => checkEitherAmountOrUseMaxAmount(transaction.data, ctx)),
});

const responseSchema = z.object({
  chainId: getSupportedChainIdsSchema(supportedChainIds),
  status: statusSchema,
});

const transactionValidateOpenAPIPath: ZodOpenApiPathsObject = {
  "/api/{chainId}/transaction/validate": {
    post: {
      tags: ["Transaction"],
      summary: "Validate Transaction",
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
            "Provides validation results, including any errors or warnings related to the transaction.",
          content: {
            "application/json": { schema: responseSchema },
          },
        },
      },
    },
  },
};

export { pathParamsSchema, requestSchema, responseSchema, transactionValidateOpenAPIPath };
