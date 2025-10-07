import { z } from "zod";
import { apiHandler } from "~/app/tools/handlers/apiHandler";
import { generateOpenAPISpec } from "~/app/tools/openapi";

export const GET = apiHandler({ responseSchema: z.any() }, async ({ request }) => {
  return generateOpenAPISpec(request.nextUrl.origin);
});
