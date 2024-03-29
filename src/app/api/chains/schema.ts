import z from "zod";
import { ZodOpenApiPathsObject } from "zod-openapi";

export const chainsConfig: ZodOpenApiPathsObject = {
  "/api/chains": {
    get: {
      responses: {
        "200": {
          description: "200 OK",
          content: {
            "application/json": { schema: z.array(z.string()) },
          },
        },
      },
    },
  },
};
