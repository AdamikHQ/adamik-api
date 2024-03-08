import { NextResponse } from "next/server";
import { CHAINS } from "~/app/config/chains";

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(Object.keys(CHAINS));
}
