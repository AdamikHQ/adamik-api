import { NextResponse } from "next/server";
import { chains } from "~/app/chains/definitions";

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(Object.keys(chains));
}
