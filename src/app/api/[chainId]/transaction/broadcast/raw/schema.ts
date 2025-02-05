import z from "zod";
import { ZodOpenApiPathsObject } from "zod-openapi";
import { getSupportedChainIdsSchema } from "~/app/api/schemaCommon";
import { CHAINS } from "~/app/config/chains";

const supportedChainIds = Object.values(CHAINS)
  .filter(
    (chain) =>
      chain.supportedFeatures.write.transaction.type.deployAccount ||
      chain.supportedFeatures.write.transaction.type.transfer ||
      chain.supportedFeatures.write.transaction.type.transferToken ||
      chain.supportedFeatures.write.transaction.type.delegate ||
      chain.supportedFeatures.write.transaction.type.redelegate ||
      chain.supportedFeatures.write.transaction.type.undelegate ||
      chain.supportedFeatures.write.transaction.type.claimRewards
  )
  .map((chain) => chain.id);

const pathParamsSchema = z.object({
  chainId: getSupportedChainIdsSchema(supportedChainIds),
});

const requestSchema = z.object({
  payload: z.string(),
});

const responseSchema = z.object({
  chainId: getSupportedChainIdsSchema(supportedChainIds),
  hash: z.string().optional(),
  // TODO Implement proper status for broadcast endpoints
  //status: statusSchema
});

const transactionBroadcastRawOpenAPIPath: ZodOpenApiPathsObject = {
  "/api/{chainId}/transaction/broadcast/raw": {
    post: {
      tags: ["Transaction"],
      summary: "Broadcast Raw Transaction",
      description:
        "Broadcasts a signed transaction to the blockchain in raw format. \
        Unlike the standard broadcast, which builds the broadcast payload for you, this endpoint requires the final payload, ready for submission. \
        Returns the transaction receipt (hash) or error details in case of failure.",
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

export { pathParamsSchema, requestSchema, responseSchema, transactionBroadcastRawOpenAPIPath };
