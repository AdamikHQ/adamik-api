import z from "zod";
import { ZodOpenApiPathsObject, extendZodWithOpenApi } from "zod-openapi";
import { bigintToStringSchema, tokenSchema } from "~/app/api/schemaCommon";
import { CHAINS } from "~/app/config/chains";
import { ChainId, StakingStatus } from "~/app/model/types_WIP";

extendZodWithOpenApi(z);

const supportedChainIds = Object.values(CHAINS)
  .filter(
    (chain) =>
      chain.supportedFeatures.read.account.balances.native ||
      chain.supportedFeatures.read.account.balances.tokens ||
      chain.supportedFeatures.read.account.balances.staking
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

const includeEnum = z.enum(["native", "tokens", "staking"]);

const queryParamsSchema = z.object({
  include: z
    .union([
      includeEnum,
      z.array(includeEnum),
      z.string().transform((val) => val.split(",").map((item) => item.trim())),
    ])
    .optional()
    .openapi({
      description:
        "Optional filter to request specific data. Can be a single value, comma-separated string, or multiple include parameters.",
    }),
});

const responseSchema = z.object({
  chainId: supportedChainIdsSchema,
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
  //status: statusSchema, TODO Should all endpoints have a status?
});

const accountStateOpenAPIPath: ZodOpenApiPathsObject = {
  "/api/account/state": {
    post: {
      tags: ["account"],
      summary: "Retrieve an account's state",
      description:
        "Returns the state of a specified account identifier (address or xpub) and chain ID, primarily focusing on available balances. Essential for wallet applications to display up-to-date balance information.",
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
            "200 OK - Returns the current balance information for the specified address and chain ID.",
          content: {
            "application/json": { schema: responseSchema },
          },
        },
      },
    },
  },
};

export { accountStateOpenAPIPath, includeEnum, queryParamsSchema, requestSchema, responseSchema };
