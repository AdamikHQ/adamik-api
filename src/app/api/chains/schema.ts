import z from "zod";
import { ZodOpenApiPathsObject } from "zod-openapi";
import { chainIdSchema, chainSchema } from "../schemaCommon";

const responseSchema = z.object({
  chains: z.record(chainIdSchema, chainSchema),
});

const chainsOpenAPIPath: ZodOpenApiPathsObject = {
  "/api/chains": {
    get: {
      tags: ["chain"],
      summary: "Retrieve details for all supported chains",
      description: "Retrieves a list of all supported blockchain networks with their detailed information.",
      responses: {
        "200": {
          description:
            "200 OK - Returns a list of names and detailed information for all supported blockchain networks.",
          content: {
            "application/json": { schema: responseSchema },
          },
        },
      },
    },
  },
};

export { chainsOpenAPIPath, responseSchema };
