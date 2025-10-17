import z from "zod";
import { ZodOpenApiPathsObject } from "zod-openapi";
import {
  encodedTransactionSchema,
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
  outputClaimRewardsSchema,
  outputDeployAccountSchema,
  outputEnableTokenSchema,
  outputFeesSchema,
  outputGasSchema,
  outputNonceSchema,
  outputParamsSchema,
  outputRegisterStakeSchema,
  outputStakeSchema,
  outputTransferNativeSchema,
  outputTransferTokenSchema,
  outputUnstakeSchema,
  outputWithdrawSchema,
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
          inputTransferTokenSchema,
          inputEnableTokenSchema,
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
  transaction: z.object({
    data: z
      .object({
        fees: outputFeesSchema,
        gas: outputGasSchema.optional(),
        nonce: outputNonceSchema.optional(),
        memo: memoSchema.optional(),
        params: outputParamsSchema.optional(),
      })
      .and(
        z.discriminatedUnion("mode", [
          outputDeployAccountSchema,
          outputTransferNativeSchema,
          outputTransferTokenSchema,
          outputEnableTokenSchema,
          outputStakeSchema,
          outputUnstakeSchema,
          outputClaimRewardsSchema,
          outputWithdrawSchema,
          outputRegisterStakeSchema,
        ])
      ),
    encoded: encodedTransactionSchema,
  }),
  status: statusSchema,
});

const transactionEncodeOpenAPIPath: ZodOpenApiPathsObject = {
  "/api/{chainId}/transaction/encode": {
    post: {
      tags: ["Transaction"],
      summary: "Encode a Transaction",
      description:
        "Encodes transaction data into a format suitable for broadcasting. This endpoint is pivotal for creating transactions that comply with the specific requirements of different blockchains.\n\nIt performs several important functions:\n\n1. **Validates** the transaction data against chain-specific rules\n2. **Computes and adds** necessary transaction parameters (fees, gas, nonce)\n3. **Calculates** the maximum spendable amount when requested\n4. **Returns** the raw data and transaction hash in the appropriate format for signing\n\nThe response includes both the transaction hash (which needs to be signed) and the raw transaction data in a chain-specific format.",
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
            "Returns the transaction data encoded into a blockchain-specific format, ready for broadcasting.",
          content: {
            "application/json": { schema: responseSchema },
          },
        },
      },
    },
  },
};

export { pathParamsSchema, requestSchema, responseSchema, transactionEncodeOpenAPIPath };
