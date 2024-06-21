import { NextResponse } from "next/server";
import { CHAINS_PUBLIC } from "~/app/config/chains";

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ chains: CHAINS_PUBLIC });
}
