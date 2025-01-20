import z from "zod";
import { ZodOpenApiPathsObject } from "zod-openapi";
import {
  encodedTransactionSchema,
  getSupportedChainIdsSchema,
  inputTransactionDataSchema,
  signatureSchema,
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
  transaction: z.object({
    data: inputTransactionDataSchema,
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
