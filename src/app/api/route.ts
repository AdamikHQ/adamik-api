import { NextResponse } from "next/server";
import { generateOpenAPIDoc } from "~/scripts/generateOpenAPIDoc";

export async function GET() {
  const apiReference = generateOpenAPIDoc();
  return NextResponse.json(apiReference);
}
