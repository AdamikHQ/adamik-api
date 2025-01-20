import z from "zod";
import { ZodOpenApiPathsObject } from "zod-openapi";
import {
  encodedTransactionSchema,
  getSupportedChainIdsSchema,
  inputTransactionDataSchema,
  outputTransactionDataSchema,
  statusSchema,
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
  }),
});

const responseSchema = z.object({
  chainId: getSupportedChainIdsSchema(supportedChainIds),
  transaction: z.object({
    data: outputTransactionDataSchema,
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
