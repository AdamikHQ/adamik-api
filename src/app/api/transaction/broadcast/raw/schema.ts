import z from "zod";
import { ZodOpenApiPathsObject } from "zod-openapi";
import { chainIdSchema } from "../../../schemaCommon";

const requestSchema = z.object({
  chainId: chainIdSchema,
  payload: z.string(),
});

const responseSchema = z.object({
  hash: z.string().optional(),
});

const transactionBroadcastOpenAPIPath: ZodOpenApiPathsObject = {
  "/api/transaction/broadcast/raw": {
    post: {
      tags: ["transaction"],
      summary: "Broadcast Raw Transaction",
      description:
        "Broadcasts a signed transaction to the blockchain in raw format. \
        Unlike the standard broadcast, which builds the broadcast payload for you, this endpoint requires the final payload, ready for submission. \
        Returns the transaction receipt (hash) or error details in case of failure.",
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

export { requestSchema, responseSchema, transactionBroadcastOpenAPIPath };
