import z from "zod";
import { ZodOpenApiPathsObject } from "zod-openapi";
import {
  getSupportedChainIdsSchema,
  inputClaimRewardsSchema,
  inputConvertAssetSchema,
  inputDeployAccountSchema,
  inputEnableTokenSchema,
  inputRegisterStakeSchema,
  inputStakeSchema,
  inputTransferNativeSchema,
  inputTransferTokenSchema,
  inputUnstakeSchema,
  inputWithdrawSchema,
  memoSchema,
  statusSchema,
} from "~/app/api/schemaCommon";
import { Chain } from "~/app/model/types_WIP";

const chainIdFilters = (chain: Chain) =>
  // This checks whether any of the supported transaction types in
  // chain.supportedFeatures.write.transaction.type.* are flagged as true
  Object.entries(chain.supportedFeatures.write.transaction.type).some((value) => value[1] === true);

const chainIdSchema = getSupportedChainIdsSchema(chainIdFilters);

const pathParamsSchema = z.object({
  chainId: chainIdSchema,
});

const requestSchema = z.object({
  transaction: z.object({
    data: z
      .object({
        memo: memoSchema.optional(),
      })
      .and(
        z.discriminatedUnion("mode", [
          inputDeployAccountSchema,
          inputTransferNativeSchema,
          inputStakeSchema,
          inputEnableTokenSchema,
          inputTransferTokenSchema,
          inputUnstakeSchema,
          inputClaimRewardsSchema,
          inputWithdrawSchema,
          inputRegisterStakeSchema,
          inputConvertAssetSchema,
        ])
      ),
  }),
});

const responseSchema = z.object({
  chainId: chainIdSchema,
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
