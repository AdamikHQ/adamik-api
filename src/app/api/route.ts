import { NextResponse } from "next/server";
import { generateOpenAPISpec } from "~/app/tools/openapi/generateOpenAPISpec";
import { apiHandlerWrapper } from "~/app/tools/handlers/apiHandler";

export const GET = apiHandlerWrapper(async () => {
  const apiSpec = generateOpenAPISpec();
  return NextResponse.json(apiSpec);
});
