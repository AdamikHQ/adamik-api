import z, { ZodIssueCode, ZodIssueOptionalMessage } from "zod";
import { ZodOpenApiPathsObject, extendZodWithOpenApi } from "zod-openapi";
import { StakingStatus, TokenType } from "~/app/model/types_WIP";
import { chainIdSchema } from "~/app/api/schemaCommon";

extendZodWithOpenApi(z);

const xpubRegex = /^([xyYzZtuUvV]pub[1-9A-HJ-NP-Za-km-z]{79,108})(?:(?:$|\?)((?!.*&c=)c=\d{10}|(?!.*&h=)h=bip\d{2,3})(?:(?=(?:&c=|&h=))&(c=\d{10}|h=bip\d{2,3}))?)?$/;

const addressSchema = z.string().min(1);

const requestSchema = z.object({
  chainId: chainIdSchema,
  // default is address, but allow for explicit address or xpub
  origin: z.union([
    addressSchema,
    z.object({ address: addressSchema }),
    z.object({ xpub: z.string().regex(xpubRegex) }),
  ])
    .transform(data => {
      if (typeof (data) === 'string') {
        return {
          address: data
        };
      }
      return data;
    })
    .openapi({
      unionOneOf: true,
      description: "Address or XPUB",
      examples: [
        "sample_address",
        { xpub: "sample_xpub" },
        { address: "sample_address" },
      ]
    }),
});
type Request = z.infer<typeof requestSchema>;

const responseSchema = z.object({
  chainId: chainIdSchema,
  address: z.string().min(1),
  balances: z.object({
    native: z.object({
      available: z.string(),
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

