import z from "zod";
import { ZodOpenApiPathsObject } from "zod-openapi";
import { chainIdSchema } from "../../schemaCommon";

const requestSchema = z.object({
  chainId: chainIdSchema,
  address: z.string(),
});

const responseSchema = z.boolean();

const addressValidateOpenAPIPath: ZodOpenApiPathsObject = {
  "/api/address/validate": {
    post: {
      tags: ["address"],
      summary: "Validate Address",
      description:
        "Validates the specified address for the given chain ID, returning true if the address is valid, otherwise false.",
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

export { addressValidateOpenAPIPath, requestSchema, responseSchema };
