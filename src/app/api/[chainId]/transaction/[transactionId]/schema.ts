import { z } from "zod";
import { ZodOpenApiPathsObject } from "zod-openapi";
import "zod-openapi/extend";
import { finalizedTransactionSchema, getSupportedChainIdsSchema, statusSchema } from "~/app/api/schemaCommon";
import { CHAINS } from "~/app/config/chains";

const supportedChainIds = Object.values(CHAINS)
  .filter(
    (chain) =>
      chain.supportedFeatures.read.transaction.native ||
      chain.supportedFeatures.read.transaction.tokens ||
      chain.supportedFeatures.read.transaction.staking
  )
  .map((chain) => chain.id);

const pathParamsSchema = z.object({
  chainId: getSupportedChainIdsSchema(supportedChainIds),
  transactionId: z.string().openapi({
    description: "Transaction ID. Usually a hash but can be different depending on the chain.",
    examples: ["559c1be45865069c6070529e43c69752d73438cbb1d04e4f301e94cd68bf7422"],
  }),
});

const includeValues = ["parsed", "raw"] as const;
type Include = (typeof includeValues)[number];

const queryParamsSchema = z.object({
  include: z
    .preprocess(
      (val) => (Array.isArray(val) ? val.join(",") : val),
      z
        .string()
        .optional()
        .transform((val) => (val ? (val.split(",") as Include[]) : undefined))
        .refine(
          (arr): arr is Include[] | undefined =>
            arr === undefined || arr.every((item): item is Include => includeValues.includes(item)),
          { message: "Invalid value" }
        )
    )
    .openapi({
      description:
        "Optional filter to request specific data. Use a single 'include' parameter with comma-separated values. Possible values are 'parsed' and 'raw'.",
      examples: ["parsed,raw", "parsed", "raw"],
    }),
});

const responseSchema = z.object({ transaction: finalizedTransactionSchema, status: statusSchema });

const transactionOpenAPIPath: ZodOpenApiPathsObject = {
  "/api/{chainId}/transaction/{transactionId}": {
    get: {
      tags: ["Transaction"],
      summary: "Get Transaction Details",
      description:
        "Retrieves detailed information about a specific transaction for a blockchain network, identified by chain ID and transaction ID.",
      requestParams: {
        path: pathParamsSchema,
        query: queryParamsSchema,
      },
      responses: {
        "200": {
          description:
            "Successfully returns detailed data about the transaction on the specified blockchain.",
          content: {
            "application/json": { schema: responseSchema },
          },
        },
      },
    },
  },
};

export { pathParamsSchema, queryParamsSchema, responseSchema, transactionOpenAPIPath };
