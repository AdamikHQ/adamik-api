import z from "zod";
import { ZodOpenApiPathsObject, extendZodWithOpenApi } from "zod-openapi";
import { finalizedTransactionSchema } from "~/app/api/schemaCommon";
import { CHAINS } from "~/app/config/chains";
import { ChainId } from "~/app/model/types_WIP";

extendZodWithOpenApi(z);

const supportedChainIds = Object.values(CHAINS)
  .filter(
    (chain) =>
      chain.supportedFeatures.read.account.transactions.native ||
      chain.supportedFeatures.read.account.transactions.tokens ||
      chain.supportedFeatures.read.account.transactions.staking
  )
  .map((chain) => chain.id);

const supportedChainIdsSchema = z.enum(supportedChainIds as [ChainId, ...ChainId[]]);

const requestSchema = z
  .object({
    chainId: supportedChainIdsSchema,
    accountId: z.string().openapi({
      description: "Account identifier (address, xpub, etc) for the specified chain ID",
    }),
  })
  .openapi({
    examples: [
      {
        chainId: ChainId.ETHEREUM,
        accountId: "0x0000000000000000000000000000000000000000",
      },
      {
        chainId: ChainId.BITCOIN,
        accountId: "xpub",
      },
    ],
  });

// FIXME Need to also add these filters? How to combine with existing one above?
// NOTE Need to manually add new modes here, when they start being supported

const includeValues = ["parsed", "raw"] as const;
type Include = (typeof includeValues)[number];

const queryParamsSchema = z.object({
  from_timestamp: z.coerce.number().optional(),
  to_timestamp: z.coerce.number().optional(),
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
          { message: "Invalid include value" }
        )
    )
    .openapi({
      description:
        "Optional filter to request specific data. Use a single 'include' parameter with comma-separated values. Possible values are 'parsed' and 'raw'.",
      example: "parsed,raw",
    }),
});

const responseSchema = z.object({
  chainId: supportedChainIdsSchema,
  accountId: z.string(),
  transactions: finalizedTransactionSchema.array(),
  //status: statusSchema, TODO Should all endpoints have a status?
});

const accountHistoryOpenAPIPath: ZodOpenApiPathsObject = {
  "/api/account/history": {
    post: {
      tags: ["account"],
      summary: "Retrieve an account's history",
      description:
        "Returns the history of a specified account identifier (address or xpub) and chain ID, primarily focusing on past transactions.",
      requestParams: {
        query: queryParamsSchema,
      },
      requestBody: {
        content: {
          "application/json": { schema: requestSchema },
        },
      },
      responses: {
        "200": {
          description:
            "200 OK - Returns the current list of transactions for the specified address and chain ID.",
          content: {
            "application/json": { schema: responseSchema },
          },
        },
      },
    },
  },
};

export { accountHistoryOpenAPIPath, queryParamsSchema, requestSchema, responseSchema };
