import z from "zod";
import { ZodOpenApiPathsObject } from "zod-openapi";
import "zod-openapi/extend";
import {
  accountIdSchema,
  bigintToStringSchema,
  getSupportedChainIdsSchema,
  tokenSchema,
} from "~/app/api/schemaCommon";
import { CHAINS } from "~/app/config/chains";
import { StakingStatus } from "~/app/model/types_WIP";

const supportedChainIds = Object.values(CHAINS)
  .filter(
    (chain) =>
      chain.supportedFeatures.read.account.balances.native ||
      chain.supportedFeatures.read.account.balances.tokens ||
      chain.supportedFeatures.read.account.balances.staking
  )
  .map((chain) => chain.id);

const pathParamsSchema = z.object({
  chainId: getSupportedChainIdsSchema(supportedChainIds),
  accountId: accountIdSchema,
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
  pubkey: z.string().optional().openapi({
    description:
      "Optional public key (in hex format) associated with the accountId. Required for Bitcoin's Babylon Staking data.",
  }),
});

const responseSchema = z.object({
  chainId: getSupportedChainIdsSchema(supportedChainIds),
  accountId: z.string(),
  balances: z.object({
    native: z
      .object({
        available: bigintToStringSchema.openapi({
          description:
            "Amount of native currency that is immediately available for using. This excludes amounts that are locked in staking positions.",
        }),
        unconfirmed: bigintToStringSchema.optional().openapi({
          description:
            "Amount of native currency that is either pending (mempool) or not yet fully confirmed (not enough block confirmations). Relevant for chains with long confirmation times (like Bitcoin).",
        }),
        total: bigintToStringSchema.openapi({
          description:
            "Total amount of native currency owned by the account, including both available and locked amounts (staking positions).",
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
            stakeId: z.string().optional().openapi({
              description: "Unique identifier for the staking position.",
            }),
            validatorAddresses: z.string().array().openapi({
              description: "List of validator addresses involved in staking position.",
            }),
            amount: bigintToStringSchema.openapi({
              description: "Amount of native currency used in this specific staking position.",
            }),
            status: z.nativeEnum(StakingStatus),
            completionDate: z.number().pipe(z.coerce.string()).optional().openapi({
              description:
                "Unix timestamp (in milliseconds) when the current position status will expire, when relevant.",
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
  "/api/{chainId}/account/{accountId}/state": {
    get: {
      tags: ["Account"],
      summary: "Get Account State (Balances)",
      description:
        "Returns the state of a specified account identifier (address or xpub) and chain ID, focusing on balance information. The response includes details on native asset balances, token balances, and staking balances. This endpoint supports optional filters to refine the results, making it essential for wallet applications to display accurate and tailored account information.",
      requestParams: {
        path: pathParamsSchema,
        query: queryParamsSchema,
      },
      responses: {
        "200": {
          description: "Returns the current balance information for the specified address and chain ID.",
          content: {
            "application/json": { schema: responseSchema },
          },
        },
      },
    },
  },
};

export { accountStateOpenAPIPath, pathParamsSchema, queryParamsSchema, responseSchema };
