import { z } from "zod";
import { extendZodWithOpenApi, ZodOpenApiPathsObject } from "zod-openapi";
import { chainIdSchemaParams, finalizedTransactionSchema, statusSchema } from "~/app/api/schemaCommon";
import { CHAINS } from "~/app/config/chains";
import { ChainId } from "~/app/model/types_WIP";

extendZodWithOpenApi(z);

const supportedChainIds = Object.values(CHAINS)
  .filter(
    (chain) =>
      chain.supportedFeatures.read.transaction.native ||
      chain.supportedFeatures.read.transaction.tokens ||
      chain.supportedFeatures.read.transaction.staking
  )
  .map((chain) => chain.id);

const supportedChainIdsSchema = z.enum(supportedChainIds as [ChainId, ...ChainId[]], chainIdSchemaParams);

const pathParamsSchema = z.object({
  chainId: supportedChainIdsSchema,
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
      example: "parsed,raw",
    }),
});

const responseSchema = z.object({ transaction: finalizedTransactionSchema, status: statusSchema });

const chainsChainIdTransactionTransactionIdOpenAPIPath: ZodOpenApiPathsObject = {
  "/api/chains/{chainId}/transaction/{transactionId}": {
    get: {
      tags: ["chains"],
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
            "200 OK - Successfully returns detailed data about the transaction on the specified blockchain.",
          content: {
            "application/json": { schema: responseSchema },
          },
        },
      },
    },
  },
};

export {
  chainsChainIdTransactionTransactionIdOpenAPIPath,
  pathParamsSchema,
  queryParamsSchema,
  responseSchema,
};
