import z from "zod";
import { ZodOpenApiPathsObject } from "zod-openapi";

const responseSchema = z.object({
  chains: z.array(z.string()),
});

const chainsOpenAPIPath: ZodOpenApiPathsObject = {
  "/api/chains": {
    get: {
      responses: {
        "200": {
          description: "200 OK",
          content: {
            "application/json": { schema: responseSchema },
          },
        },
      },
    },
  },
};

export { chainsOpenAPIPath };
