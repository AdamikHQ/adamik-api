import "~/app/patch";
import { NextResponse } from "next/server";
import { generateOpenAPIDoc } from "~/app/swagger/generateOpenAPIDoc";

export async function GET() {
  const apiReference = generateOpenAPIDoc();
  return NextResponse.json(apiReference);
}
