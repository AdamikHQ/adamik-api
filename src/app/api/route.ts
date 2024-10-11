import { z } from "zod";
import { apiHandler } from "~/app/tools/handlers/apiHandler";
import { generateOpenAPISpec } from "~/app/tools/openapi/generateOpenAPISpec";

export const GET = apiHandler({ responseSchema: z.any() }, async () => {
  return generateOpenAPISpec();
});
