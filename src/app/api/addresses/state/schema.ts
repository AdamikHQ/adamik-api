import z from "zod";
import { ZodOpenApiPathsObject, extendZodWithOpenApi } from "zod-openapi";
import { ChainId, TokenType } from "~/app/model/types_WIP";
import { chainIdSchema } from "../../schemaCommon";

extendZodWithOpenApi(z);

const requestSchema = z.object({
  chainId: chainIdSchema,
  addresses: z.string().min(1).array()
}).openapi({
  description: "List of addresses for the specified chain ID",
  examples: [
    {
      chainId: ChainId.BITCOIN,
      addresses: ["sample_address1", "sample_address2"],
    },
  ]
});

const responseSchema = z.object({
  chainId: z.string(),
  addresses: z.object({
    address: z.string().min(1),
    balances: z.object({
      native: z.object({
        available: z.string(),
      }),
      tokens: z.object({
        token: z.object({
          chainId: z.string(),
          type: z.nativeEnum(TokenType),
          id: z.string(),
          name: z.string(),
          ticker: z.string(),
          decimals: z.number(),
          contractAddress: z.string().optional(),
        }),
        value: z.string(),
      })
        .array()
        .optional(),
    })
  }).array(),
});

const addressesStateOpenAPIPath: ZodOpenApiPathsObject = {
  "/api/addresses/state": {
    post: {
      tags: ["address"],
      description:
        "Returns the addresses state for a specified list of addresses and chain ID, primarily focusing on available balances. Essential for wallet applications to display up-to-date balance information.",
      requestBody: {
        content: {
          "application/json": { schema: requestSchema },
        },
      },
      responses: {
        "200": {
          description:
            "200 OK - Returns the current balance information for the specified addresses and chain ID.",
          content: {
            "application/json": { schema: responseSchema },
          },
        },
      },
    },
  },
};

export { requestSchema, responseSchema, addressesStateOpenAPIPath };
