import { NextResponse } from "next/server";
import { generateOpenAPISpec } from "~/app/tools/openapi/generateOpenAPISpec";
import { apiHandler } from "~/app/api/handlers/apiHandler";

async function GET() {
  const apiSpec = generateOpenAPISpec();
  return NextResponse.json(apiSpec);
}

module.exports = apiHandler({
  GET
});