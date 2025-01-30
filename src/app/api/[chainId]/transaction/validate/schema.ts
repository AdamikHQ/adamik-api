import z from "zod";
import { ZodOpenApiPathsObject } from "zod-openapi";
import {
  formatSchema,
  getSupportedChainIdsSchema,
  inputDeployAccountSchema,
  inputStakingClaimRewardsSchema,
  inputStakingDelegateSchema,
  inputStakingRedelegateSchema,
  inputStakingUndelegateSchema,
  inputTransferNativeSchema,
  inputTransferTokenSchema,
  memoSchema,
  statusSchema,
} from "~/app/api/schemaCommon";
import { CHAINS } from "~/app/config/chains";

const supportedChainIds = Object.values(CHAINS)
  .filter(
    (chain) =>
      chain.supportedFeatures.write.transaction.type.claimRewards ||
      chain.supportedFeatures.write.transaction.type.deployAccount ||
      chain.supportedFeatures.write.transaction.type.transfer ||
      chain.supportedFeatures.write.transaction.type.transferToken ||
      chain.supportedFeatures.write.transaction.type.delegate ||
      chain.supportedFeatures.write.transaction.type.redelegate ||
      chain.supportedFeatures.write.transaction.type.undelegate
  )
  .map((chain) => chain.id);

const pathParamsSchema = z.object({
  chainId: getSupportedChainIdsSchema(supportedChainIds),
});

const requestSchema = z.object({
  transaction: z.object({
    data: z
      .object({
        memo: memoSchema.optional(),
        format: formatSchema.optional(),
      })
      .and(
        z.discriminatedUnion("mode", [
          inputDeployAccountSchema,
          inputTransferNativeSchema,
          inputStakingDelegateSchema,
          inputTransferTokenSchema,
          inputStakingUndelegateSchema,
          inputStakingRedelegateSchema,
          inputStakingClaimRewardsSchema,
        ])
      ),
  }),
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
