import { z } from "zod";
import { extendZodWithOpenApi, ZodOpenApiPathsObject } from "zod-openapi";
import { chainSchema } from "../../utils/zodCommon";

extendZodWithOpenApi(z);

export const chainsChainIdConfig: ZodOpenApiPathsObject = {
  "/api/chains/{chainId}": {
    get: {
      requestParams: {
        path: z.object({
          chainId: z.string().openapi({
            description: "Chain ID",
            example: "cosmoshub",
          }),
        }),
      },
      responses: {
        "200": {
          description: "200 OK",
          content: {
            "application/json": { schema: chainSchema },
          },
        },
      },
    },
  },
};
