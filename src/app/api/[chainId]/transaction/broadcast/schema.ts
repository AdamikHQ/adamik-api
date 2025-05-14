import z from "zod";
import { ZodOpenApiPathsObject } from "zod-openapi";
import {
  encodedTransactionSchema,
  getSupportedChainIdsSchema,
  inputClaimRewardsSchema,
  inputDeployAccountSchema,
  inputFeesSchema,
  inputGasSchema,
  inputNonceSchema,
  inputParamsSchema,
  inputRegisterStakeSchema,
  inputStakeSchema,
  inputTransferNativeSchema,
  inputTransferTokenSchema,
  inputUnstakeSchema,
  inputWithdrawSchema,
  memoSchema,
  signatureSchema,
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
        fees: inputFeesSchema,
        gas: inputGasSchema.optional(),
        nonce: inputNonceSchema.optional(),
        memo: memoSchema.optional(),
        params: inputParamsSchema.optional(),
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
    encoded: encodedTransactionSchema,
    signature: signatureSchema,
  }),
});

const responseSchema = z.object({
  chainId: getSupportedChainIdsSchema(supportedChainIds),
  hash: z.string().optional(),
  // TODO Implement proper status for broadcast endpoints
  //status: statusSchema
});

const transactionBroadcastOpenAPIPath: ZodOpenApiPathsObject = {
  "/api/{chainId}/transaction/broadcast": {
    post: {
      tags: ["Transaction"],
      summary: "Broadcast Transaction",
      description:
        "Broadcasts a signed transaction to the blockchain, crucial for submitting transactions like transfers, delegations, or reward claims. Returns a transaction receipt (hash) or error details.\n\n\nNote: the exact same 'data' and 'encoded' fields that were retrieved with the /transaction/encode endpoint, must be provided here.",
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
          description: "Returns a transaction receipt or error details if the transaction fails.",
          content: {
            "application/json": { schema: responseSchema },
          },
        },
      },
    },
  },
};

export { pathParamsSchema, requestSchema, responseSchema, transactionBroadcastOpenAPIPath };
