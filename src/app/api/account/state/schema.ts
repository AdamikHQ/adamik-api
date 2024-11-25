import z from "zod";
import { ZodOpenApiPathsObject, extendZodWithOpenApi } from "zod-openapi";
import { bigintToStringSchema, chainIdSchemaParams, tokenSchema } from "~/app/api/schemaCommon";
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

const supportedChainIdsSchema = z.enum(supportedChainIds as [ChainId, ...ChainId[]], chainIdSchemaParams);

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

const includeValues: readonly string[] = ["native", "tokens", "staking"] as const;
const queryParamsSchema = z.object({
  include: z
    .preprocess(
      (val) => (Array.isArray(val) ? val.join(",") : val),
      z
        .string()
        .optional()
        .transform((val) => (val ? val.split(",") : undefined))
        .refine((arr) => arr === undefined || arr.every((item) => includeValues.includes(item)), {
          message: "Invalid value",
        })
    )
    .openapi({
      description:
        "Optional filter to request specific data. Use a single 'include' parameter with comma-separated values.",
      example: "native,tokens,staking",
    }),
});

const responseSchema = z.object({
  chainId: supportedChainIdsSchema,
  accountId: z.string(),
  balances: z.object({
    native: z
      .object({
        available: bigintToStringSchema.openapi({
          description:
            "Amount of native currency that is immediately available for using. This excludes amounts that are locked in unconfirmed transactions or staking positions.",
        }),
        unconfirmed: bigintToStringSchema.optional().openapi({
          description:
            "Amount of native currency that is pending (mempool) or in unconfirmed transactions (not enough block confirmations). Relevant for chains with long confirmation times (like Bitcoin).",
        }),
        total: bigintToStringSchema.openapi({
          description:
            "Total amount of native currency owned by the account, including both available and locked amounts (staking, pending transactions, etc.).",
        }),
      })
      .optional(),
    tokens: z
      .object({
        token: tokenSchema,
        amount: bigintToStringSchema.openapi({
          description:
            "Current balance of this token owned by the account. The amount is expressed in the token's smallest unit (based on its decimals).",
        }),
      })
      .array()
      .optional(),
    staking: z
      .object({
        total: bigintToStringSchema.openapi({
          description:
            "Total amount of native currency involved in staking positions (locked + unlocking + unlocked).",
        }),
        locked: bigintToStringSchema.openapi({
          description: "Amount of native currency currently locked in staking positions.",
        }),
        unlocking: bigintToStringSchema.openapi({
          description:
            "Amount of native currency that is in the process of being unstaked (during unbonding period).",
        }),
        unlocked: bigintToStringSchema.openapi({
          description:
            "Amount of native currency that has completed the unbonding period and is ready to be withdrawn.",
        }),
        positions: z
          .object({
            validatorAddresses: z.string().array().openapi({
              description: "List of validator addresses involved in staking position.",
            }),
            amount: bigintToStringSchema.openapi({
              description: "Amount of native currency used in this specific staking position.",
            }),
            status: z.nativeEnum(StakingStatus),
            completionDate: z.number().optional().openapi({
              description:
                "Unix timestamp (in milliseconds) when the unbonding period will complete. Only present for positions with 'unlocking' status.",
            }),
          })
          .array()
          .openapi({
            description: "Detailed list of individual staking positions.",
          }),
        rewards: z
          .object({
            native: z
              .object({
                validatorAddress: z.string(),
                amount: bigintToStringSchema.openapi({
                  description: "Amount of unclaimed staking rewards in native currency from this validator.",
                }),
              })
              .array()
              .openapi({
                description: "List of unclaimed staking rewards in native currency, per validator.",
              }),
            tokens: z
              .object({
                token: tokenSchema,
                validatorAddress: z.string().optional(),
                amount: bigintToStringSchema.openapi({
                  description:
                    "Amount of unclaimed staking rewards in this token. The amount is expressed in the token's smallest unit.",
                }),
              })
              .array(),
          })
          .optional()
          .openapi({
            description: "Information about unclaimed staking rewards, both in native currency and tokens.",
          }),
      })
      .optional(),
  }),
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

export { accountStateOpenAPIPath, queryParamsSchema, requestSchema, responseSchema };
