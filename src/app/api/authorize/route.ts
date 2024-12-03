import { Redis } from "ioredis";
import { NextRequest, NextResponse } from "next/server";
import { env } from "~/env";

export const redis = new Redis(env.REDIS_URL);

export const GET = async (request: NextRequest, response: NextResponse) => {
  const apiKey = request.nextUrl.searchParams.get("apiKey");

  if (!apiKey) {
    return NextResponse.json({ clientId: undefined }, { status: 400 });
  }

  const client = await redis.hgetall(`clients:${apiKey}`);

  if (Object.keys(client).length === 0) {
    return NextResponse.json({ clientId: undefined }, { status: 401 });
  }

  return NextResponse.json({ ...client });
};
