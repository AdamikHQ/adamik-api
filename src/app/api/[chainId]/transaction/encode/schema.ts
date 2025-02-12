import z from "zod";
import { ZodOpenApiPathsObject } from "zod-openapi";
import {
  encodedTransactionSchema,
  formatSchema,
  getSupportedChainIdsSchema,
  inputClaimRewardsSchema,
  inputDeployAccountSchema,
  inputStakeSchema,
  inputTransferNativeSchema,
  inputTransferTokenSchema,
  inputUnstakeSchema,
  memoSchema,
  outputClaimRewardsSchema,
  outputDeployAccountSchema,
  outputFeesSchema,
  outputGasSchema,
  outputNonceSchema,
  outputParamsSchema,
  outputStakeSchema,
  outputTransferNativeSchema,
  outputTransferTokenSchema,
  outputUnstakeSchema,
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
        format: formatSchema.optional(),
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
