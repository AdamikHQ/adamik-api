import { NextRequest, NextResponse } from "next/server";
import { get as getVercelEdgeConfig } from "@vercel/edge-config";

type ClientData = {
  clientId: string; // adamik generated ID
  apiKey: string;
  creationDate: number;
  nickname: string; // for display purposes only
};

export async function middleware(request: NextRequest) {
  const isPreflight = request.method === "OPTIONS";
  if (isPreflight) {
    return NextResponse.json({});
  }

  const apiKey = request.headers.get("Authorization");
  // FIXME: use postgres instead of Vercel config
  const clients: readonly ClientData[] | undefined = await getVercelEdgeConfig("clients");
  const client = clients?.find((client) => client.apiKey === apiKey);

  console.log("API KEY:", client?.apiKey);

  const headers = new Headers(request.headers);
  headers.set("X-Adamik-Customer-Id", client?.clientId || "unknown");

  // NOTE No additional checks for now
  // In the future we could apply rate limits, or special access rights
  if (!client) {
    return NextResponse.json(
      { message: `Missing or invalid API key` },
      { status: 401, statusText: `Unauthorized` }
    );
  }
  return NextResponse.next({
    // New option `request.headers` which accepts a Headers object
    // overrides request headers with the specified new ones.
    // NB: although we "return" a response, this actually gets forwarded to route
    request: {
      headers,
    },
  });
}

// Limit the middleware to paths starting with `/api/`
export const config = {
  matcher: "/api/:function*",
};
