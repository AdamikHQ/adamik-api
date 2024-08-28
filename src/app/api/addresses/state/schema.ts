import z from "zod";
import { ZodOpenApiPathsObject, extendZodWithOpenApi } from "zod-openapi";
import { ChainId, TokenType } from "~/app/model/types_WIP";
import { chainIdSchema } from "../../schemaCommon";

extendZodWithOpenApi(z);

const requestSchema = z
  .object({
    chainId: chainIdSchema,
    addresses: z.string().min(1).array().openapi({
      description:
        "A list of addresses for the specified chain ID. \
        The addresses must all belong to the same account, as their individual balances will be aggregated in the response",
    }),
  })
  .openapi({
    examples: [
      {
        chainId: ChainId.BITCOIN,
        addresses: [
          "bc1pv8g4dn4kn5ad5ja7xd6wukahak5rq9nphmj6qz9x0kccp0plze7sc607qc",
          "bc1p8m0x92feq3kvhr2np0dmk6eft3cm25pcvxqx0yqy0uskqvx9jmrs6skn84",
        ],
      },
    ],
  });

const responseSchema = z.object({
  chainId: z.string(),
  addresses: z
    .object({
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
            value: z.string(),
          })
          .array()
          .optional(),
      }),
    })
    .array(),
});

const addressesStateOpenAPIPath: ZodOpenApiPathsObject = {
  "/api/addresses/state": {
    post: {
      tags: ["addresses"],
      summary: "Retrieve an account's state from a list of addresses",
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
