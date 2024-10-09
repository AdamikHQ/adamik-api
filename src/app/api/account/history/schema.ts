import z from "zod";
import { ZodOpenApiPathsObject, extendZodWithOpenApi } from "zod-openapi";
import { chainIdSchema, finalizedTransactionSchema, statusSchema } from "~/app/api/schemaCommon";
import { ChainId } from "~/app/model/types_WIP";

extendZodWithOpenApi(z);

const requestSchema = z
  .object({
    chainId: chainIdSchema,
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

// TODO ?
/*
const requestParamsSchema = z.object({
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
});
*/

const responseSchema = z
  .object({
    chainId: chainIdSchema,
    accountId: z.string(),
    transactions: finalizedTransactionSchema.array(),
  })
  .merge(statusSchema);

const accountHistoryOpenAPIPath: ZodOpenApiPathsObject = {
  "/api/account/history": {
    post: {
      tags: ["account"],
      summary: "Retrieve an account's history",
      description:
        "Returns the history of a specified account identifier (address or xpub) and chain ID, primarily focusing on past transactions.",
      requestParams: {
        // TODO ?
        //query: requestParamsSchema,
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

export { accountHistoryOpenAPIPath, requestSchema, responseSchema };
