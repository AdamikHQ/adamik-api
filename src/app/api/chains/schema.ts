import z from "zod";
import { ZodOpenApiPathsObject } from "zod-openapi";

const responseSchema = z.object({
  chains: z.array(z.string()),
});

const chainsOpenAPIPath: ZodOpenApiPathsObject = {
  "/api/chains": {
    description: "Retrieves a list of all supported blockchain networks.",
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
