import { NextResponse } from "next/server";
import { generateOpenAPISpec } from "~/app/tools/openapi/generateOpenAPISpec";

export async function GET() {
  const apiSpec = generateOpenAPISpec();
  return NextResponse.json(apiSpec);
}
