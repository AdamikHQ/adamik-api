import z from "zod";
import { ZodOpenApiPathsObject } from "zod-openapi";
import { ChainFamily, ChainId } from "~/app/model/types_WIP";

const responseSchema = z.object({
  chains: z.record(
    z.string(),
    z.object({
      id: z.nativeEnum(ChainId),
      name: z.string(),
      family: z.nativeEnum(ChainFamily),
      isTestnet: z.boolean().optional(),
      params: z.any().optional(),
    })
  ),
});

const chainsOpenAPIPath: ZodOpenApiPathsObject = {
  "/api/chains": {
    get: {
      tags: ["chains"],
      description: "Retrieves a list of all supported blockchain networks.",
      responses: {
        "200": {
          description: "200 OK - Returns a list of names for all supported blockchain networks.",
          content: {
            "application/json": { schema: responseSchema },
          },
        },
      },
    },
  },
};

export { chainsOpenAPIPath };
