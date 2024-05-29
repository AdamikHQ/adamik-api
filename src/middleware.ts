import { NextRequest, NextResponse } from "next/server";
import { get as getVercelEdgeConfig } from "@vercel/edge-config";

type ClientData = {
  clientId: string;
  apiKey: string;
};

export async function middleware(request: NextRequest) {
  const isPreflight = request.method === "OPTIONS";
  if (isPreflight) {
    return NextResponse.json({});
  }

  const apiKey = request.headers.get("Authorization");
  const clients: readonly ClientData[] | undefined = await getVercelEdgeConfig("clients");
  const client = clients?.find((client) => client.apiKey === apiKey);

  console.log("API KEY:", client?.apiKey);

  // NOTE No additional checks for now
  // In the future we could apply rate limits, or special access rights
  if (!client) {
    return NextResponse.json(
      { message: `Missing or invalid API key` },
      { status: 401, statusText: `Unauthorized` }
    );
  }
}

// Limit the middleware to paths starting with `/api/`
export const config = {
  matcher: "/api/:function*",
};
