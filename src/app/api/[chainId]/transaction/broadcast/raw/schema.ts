import z from "zod";
import { ZodOpenApiPathsObject } from "zod-openapi";
import { chainIdSchema } from "~/app/api/schemaCommon";

const pathParamsSchema = z.object({
  chainId: chainIdSchema,
});

const requestSchema = z.object({
  chainId: chainIdSchema,
  payload: z.string(),
});

const responseSchema = z.object({
  hash: z.string().optional(),
});

const transactionBroadcastRawOpenAPIPath: ZodOpenApiPathsObject = {
  "/api/{chainId}/transaction/broadcast/raw": {
    post: {
      tags: ["transaction"],
      summary: "Broadcast a signed transaction (raw format)",
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
          description: "200 OK - Returns a transaction receipt or error details if the transaction fails.",
          content: {
            "application/json": { schema: responseSchema },
          },
        },
      },
    },
  },
};

export { pathParamsSchema, requestSchema, responseSchema, transactionBroadcastRawOpenAPIPath };
