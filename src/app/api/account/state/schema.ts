import z from "zod";
import { ZodOpenApiPathsObject, extendZodWithOpenApi } from "zod-openapi";
import { bigintToStringSchema, chainIdSchema, tokenSchema } from "~/app/api/schemaCommon";
import { ChainId, StakingStatus } from "~/app/model/types_WIP";

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

const responseSchema = z.object({
  chainId: chainIdSchema,
  accountId: z.string(),
  balances: z.object({
    native: z
      .object({
        available: bigintToStringSchema,
        total: bigintToStringSchema,
      })
      .optional(),
    tokens: z
      .object({
        token: tokenSchema,
        amount: bigintToStringSchema,
      })
      .array()
      .optional(),
  }),
  staking: z
    .object({
      total: bigintToStringSchema,
      locked: bigintToStringSchema,
      unlocking: bigintToStringSchema,
      unlocked: bigintToStringSchema,
      positions: z
        .object({
          validatorAddresses: z.string().array(),
          amount: bigintToStringSchema,
          status: z.nativeEnum(StakingStatus),
          completionDate: z.number().optional(),
        })
        .array(),
      rewards: z
        .object({
          native: z
            .object({
              validatorAddress: z.string(),
              amount: bigintToStringSchema,
            })
            .array(),
          tokens: z
            .object({
              token: tokenSchema,
              validatorAddress: z.string().optional(),
              amount: bigintToStringSchema,
            })
            .array(),
        })
        .optional(),
    })
    .optional(),
});

const accountStateOpenAPIPath: ZodOpenApiPathsObject = {
  "/api/account/state": {
    post: {
      tags: ["account"],
      summary: "Retrieve an account's state",
      description:
        "Returns the state of a specified account identifier (address or xpub) and chain ID, primarily focusing on available balances. Essential for wallet applications to display up-to-date balance information.",
      requestParams: {
        query: requestParamsSchema,
      },
      requestBody: {
        content: {
          "application/json": { schema: requestSchema },
        },
      },
      responses: {
        "200": {
          description:
            "200 OK - Returns the current balance information for the specified address and chain ID.",
          content: {
            "application/json": { schema: responseSchema },
          },
        },
      },
    },
  },
};

export { accountStateOpenAPIPath, requestSchema, responseSchema };
