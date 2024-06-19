import z from "zod";
import { ZodOpenApiPathsObject } from "zod-openapi";

const ACCOUNT_ORIGIN_VALUES = ["Address", "Xpub"] as const;
const AccountOriginEnums = z.enum(ACCOUNT_ORIGIN_VALUES);

const requestSchema = z.object({
  chainId: z.string().min(1),
  account: z.object({
    origin: AccountOriginEnums,
    value: z.string().min(1),
  }),
});

const responseSchema = z.object({
  chainId: z.string(),
  address: z.string().min(1),
  balances: z.object({
    native: z.object({
      available: z.string(),
      unconfirmed: z.string().optional(),
    }),
    tokens: z
      .object({
        tokenId: z.string(),
        value: z.string(),
      })
      .array()
      .optional(),
  }),
});

const dataStateOpenAPIPath: ZodOpenApiPathsObject = {
  "/api/data/state": {
    post: {
      tags: ["data"],
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

export { requestSchema, responseSchema, dataStateOpenAPIPath };
