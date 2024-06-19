import { NextResponse } from "next/server";
import { generateOpenAPIDoc } from "~/app/api/tools/openapi/generateOpenAPIDoc";

export async function GET() {
  const apiReference = generateOpenAPIDoc();
  return NextResponse.json(apiReference);
}
