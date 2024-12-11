import z from "zod";
import { ZodOpenApiPathsObject } from "zod-openapi";
import { chainIdSchema } from "~/app/api/schemaCommon";

const pathParamsSchema = z.object({
  chainId: chainIdSchema,
});

const requestSchema = z.object({
  address: z.string(),
});

const responseSchema = z.object({
  chainId: chainIdSchema,
  valid: z.boolean(),
});

const addressValidateOpenAPIPath: ZodOpenApiPathsObject = {
  "/api/{chainId}/address/validate": {
    post: {
      tags: ["Utils"],
      summary: "Validate Address",
      description:
        "Validates the specified address for the given chain ID, returning true if the address is valid, otherwise false.",
      requestParams: {
        path: pathParamsSchema,
      },
      requestBody: {
        content: {
          "application/json": { schema: requestSchema },
        },
      },
      responses: {
        "200": {
          description:
            "200 OK - Returns true if the address is valid for the specified chain ID, otherwise false.",
          content: {
            "application/json": { schema: responseSchema },
          },
        },
      },
    },
  },
};

export { addressValidateOpenAPIPath, pathParamsSchema, requestSchema, responseSchema };
