import { NextResponse } from "next/server";
import { displayChains } from "~/app/config/chains";

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ chains: displayChains });
}
