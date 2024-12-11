import z from "zod";
import { ZodOpenApiPathsObject } from "zod-openapi";
import {
  getSupportedChainIdsSchema,
  inputTransactionDataSchema,
  signedAndEncodedTransactionSchema,
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
  transaction: inputTransactionDataSchema.and(signedAndEncodedTransactionSchema),
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
        "Broadcasts a signed transaction to the blockchain, crucial for submitting transactions like transfers, delegations, or reward claims. Returns a transaction receipt (hash) or error details.",
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
          description: "200 OK - Returns a transaction receipt or error details if the transaction fails.",
          content: {
            "application/json": { schema: responseSchema },
          },
        },
      },
    },
  },
};

export { pathParamsSchema, requestSchema, responseSchema, transactionBroadcastOpenAPIPath };
