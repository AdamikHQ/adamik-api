import z from "zod";
import { ZodOpenApiPathsObject } from "zod-openapi";
import {
  encodedTransactionSchema,
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
  outputClaimRewardsSchema,
  outputDeployAccountSchema,
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
        "Encodes transaction data into a format suitable for broadcasting. This function is pivotal for creating transactions that comply with the specific requirements of different blockchains.\
        It also completes the input transaction with computed data, such as fees and max spendable amount, and performs some chain-specific validation checks on the transaction.",
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
