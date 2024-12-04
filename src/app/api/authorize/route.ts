import { NextRequest, NextResponse } from "next/server";
import { createClient } from "redis";
import { env } from "~/env";

const redis = createClient({
  url: env.REDIS_URL,
});

redis.connect();

export const GET = async (request: NextRequest) => {
  const apiKey = request.nextUrl.searchParams.get("apiKey");

  if (!apiKey) {
    return NextResponse.json({ exist: false }, { status: 400 });
  }

  const clientId = await redis.hGet(`clients:${apiKey}`, "clientId");

  if (!clientId) {
    return NextResponse.json({ exist: false }, { status: 401 });
  }

  return NextResponse.json({ exist: true, clientId });
};
