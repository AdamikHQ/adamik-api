import { AdamikResponse, apiHandlerWrapper } from "~/app/tools/handlers/apiHandler";
import { generateOpenAPISpec } from "~/app/tools/openapi/generateOpenAPISpec";

export const GET = apiHandlerWrapper(async () => {
  const apiSpec = generateOpenAPISpec();
  return AdamikResponse.json(apiSpec);
});
