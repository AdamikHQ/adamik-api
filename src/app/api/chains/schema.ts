import z from "zod";
import { ZodOpenApiPathsObject } from "zod-openapi";
import { chainSchema } from "../schemaCommon";

const responseSchema = z.object({
  chains: z.record(z.string(), chainSchema),
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
