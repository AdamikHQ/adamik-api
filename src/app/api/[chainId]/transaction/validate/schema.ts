import z from "zod";
import { ZodOpenApiPathsObject } from "zod-openapi";
import {
  formatSchema,
  getSupportedChainIdsSchema,
  inputClaimRewardsSchema,
  inputDeployAccountSchema,
  inputRegisterStakeSchema,
  inputStakeSchema,
  inputTransferNativeSchema,
  inputTransferTokenSchema,
  inputUnstakeSchema,
  inputWithdrawSchema,
  memoSchema,
  statusSchema,
} from "~/app/api/schemaCommon";
import { CHAINS } from "~/app/config/chains";

const supportedChainIds = Object.values(CHAINS)
  .filter((chain) =>
    // This checks whether any of the supported transaction types in
    // chain.supportedFeatures.write.transaction.type.* are flagged as true
    Object.entries(chain.supportedFeatures.write.transaction.type).some((value) => value[1] === true)
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
          inputStakeSchema,
          inputTransferTokenSchema,
          inputUnstakeSchema,
          inputClaimRewardsSchema,
          inputWithdrawSchema,
          inputRegisterStakeSchema,
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
