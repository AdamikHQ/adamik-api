import z from "zod";
import { ZodOpenApiPathsObject } from "zod-openapi";

const responseSchema = z.object({});

const apiOpenAPIPath: ZodOpenApiPathsObject = {
  "/api": {
    get: {
      tags: [""],
      summary: "Open API Specification",
      description: "Provides the Open API specification of the Adamik API",
      responses: {
        "200": {
          description: "Returns the OpenAPI spec of the Adamik API, in JSON format",
          content: {
            "application/json": { schema: responseSchema },
          },
        },
      },
    },
  },
};

export { apiOpenAPIPath };
