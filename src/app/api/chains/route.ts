import { NextResponse } from "next/server";
import { CHAINS_PUBLIC } from "~/app/config/chains";
import { apiHandler } from "~/app/tools/handlers/apiHandler";

async function GET(): Promise<NextResponse> {
  return NextResponse.json({ chains: CHAINS_PUBLIC });
}

module.exports = apiHandler({
  GET
});