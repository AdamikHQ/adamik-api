import z from "zod";
import { ZodOpenApiPathsObject, extendZodWithOpenApi } from "zod-openapi";
import {
  accountIdSchema,
  finalizedTransactionSchema,
  getSupportedChainIdsSchema,
  paginatedResponseSchema,
  paginationQueryParamsSchema,
} from "~/app/api/schemaCommon";
import { CHAINS } from "~/app/config/chains";

extendZodWithOpenApi(z);

const supportedChainIds = Object.values(CHAINS)
  .filter(
    (chain) =>
      chain.supportedFeatures.read.account.transactions.native ||
      chain.supportedFeatures.read.account.transactions.tokens ||
      chain.supportedFeatures.read.account.transactions.staking
  )
  .map((chain) => chain.id);

const pathParamsSchema = z.object({
  chainId: getSupportedChainIdsSchema(supportedChainIds),
  accountId: accountIdSchema,
});

// NOTE Need to manually add new modes here, when they start being supported
const includeValues = ["parsed", "raw"] as const;
type Include = (typeof includeValues)[number];

const queryParamsSchema = paginationQueryParamsSchema.merge(
  z.object({
    include: z
      .preprocess(
        // we make sure to handle both array and joined strings alike (Next formats query parameters differently depending on route verb
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
        // FIXME Should we add the following filters (native, tokens, staking)?
        // How to combine with existing one above 'raw' and 'parsed'?
        /*
  include: z
    .array(
      z.enum([
        // NOTE Need to manually add new modes here, when they start being supported
        "native",
        "tokens",
        "staking",
      ])
    )
    .nonempty()
    .optional()
    .openapi({
      description: "Optional filter, to let you request only the data that you need.",
    }),
    */
      )
      .openapi({
        description:
          "Optional filter to request specific data. Use a single 'include' parameter with comma-separated values. Possible values are 'parsed' and 'raw'.",
        example: "parsed,raw",
      }),
  })
);

const responseSchema = z
  .object({
    chainId: getSupportedChainIdsSchema(supportedChainIds),
    accountId: z.string(),
    transactions: finalizedTransactionSchema.array(),
    //status: statusSchema, TODO Should all endpoints have a status?
  })
  .merge(paginatedResponseSchema);

const accountHistoryOpenAPIPath: ZodOpenApiPathsObject = {
  "/api/{chainId}/account/{accountId}/history": {
    get: {
      tags: ["account"],
      summary: "Retrieve an account's history",
      description:
        "Returns the history of a specified account identifier (address or xpub) and chain ID, primarily focusing on past transactions.",
      requestParams: {
        path: pathParamsSchema,
        query: queryParamsSchema,
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

export { accountHistoryOpenAPIPath, pathParamsSchema, queryParamsSchema, responseSchema };
