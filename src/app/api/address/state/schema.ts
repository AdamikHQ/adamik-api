import z, { ZodIssueCode, ZodIssueOptionalMessage } from "zod";
import { ZodOpenApiPathsObject, extendZodWithOpenApi } from "zod-openapi";
import { ChainId, StakingStatus, TokenType } from "~/app/model/types_WIP";
import { chainIdSchema } from "~/app/api/schemaCommon";

extendZodWithOpenApi(z);

const addressSchema = z.string().min(1);

const requestSchema = z.object({
  chainId: chainIdSchema,
  // default is address, but allow for explicit address or xpub
}).and(
  z.object({
    address: addressSchema,
  }).openapi({
    title: "address",
    deprecated: true,
  }).or(
    z.object({
      accountId: z.string(),
    }).openapi({
      title: "account id (either an address or an xpub)",
    })
  ).transform((object) => {
    if ('address' in object) {
      return {
        accountId: object.address
      };
    }
    return object;
  })
).openapi({
  examples: [
    {
      chainId: ChainId.ETHEREUM,
      address: "0x0000000000000000000000000000000000000000"
    },
    {
      chainId: ChainId.ETHEREUM,
      accountId: "0x0000000000000000000000000000000000000000",
    },
    {
      chainId: ChainId.BITCOIN,
      accountId: "xpub",
    },
  ]
});
type Request = z.infer<typeof requestSchema>;

const responseSchema = z.object({
  chainId: chainIdSchema,
  address: z.string().min(1),
  balances: z.object({
    native: z.object({
      available: z.string(),
      total: z.string(),
    }),
    tokens: z
      .object({
        token: z.object({
          chainId: z.string(),
          type: z.nativeEnum(TokenType),
          id: z.string(),
          name: z.string(),
          ticker: z.string(),
          decimals: z.number(),
          contractAddress: z.string().optional(),
        }),
        amount: z.string(),
      })
      .array()
      .optional(),
  }),
  staking: z
    .object({
      total: z.string(),
      locked: z.string(),
      unlocking: z.string(),
      unlocked: z.string(),
      positions: z
        .object({
          validatorAddresses: z.string().array(),
          amount: z.string(),
          status: z.nativeEnum(StakingStatus),
          completionDate: z.number().optional(),
        })
        .array(),
      rewards: z
        .object({
          native: z
            .object({
              validatorAddress: z.string(),
              amount: z.string(),
            })
            .array(),
          tokens: z
            .object({
              tokenId: z.string(),
              validatorAddress: z.string().optional(),
              amount: z.string(),
            })
            .array(),
        })
        .optional(),
    })
    .optional(),
});

const addressStateOpenAPIPath: ZodOpenApiPathsObject = {
  "/api/address/state": {
    post: {
      tags: ["address"],
      description:
        "Returns the account state for a specified address and chain ID, primarily focusing on available balances. Essential for wallet applications to display up-to-date balance information.",
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

export { addressStateOpenAPIPath, requestSchema, responseSchema };

