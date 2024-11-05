import { get as getVercelEdgeConfig } from "@vercel/edge-config";
import { NextRequest, NextResponse } from "next/server";

type ClientData = {
  clientId: string; // adamik generated ID
  apiKey: string;
  creationDate: number;
};

export async function middleware(request: NextRequest) {
  const isPreflight = request.method === "OPTIONS";
  if (isPreflight) {
    return NextResponse.json({});
  }

  const apiKey = request.headers.get("Authorization");
  // TODO Use postgres instead of edge config
  const clients: readonly ClientData[] | undefined = await getVercelEdgeConfig("clients");
  const client = clients?.find((client) => client.apiKey === apiKey);

  // NOTE No additional checks for now
  // In the future we could apply rate limits, or special access rights
  if (!client) {
    return NextResponse.json(
      { message: `Missing or invalid API key` },
      { status: 401, statusText: `Unauthorized` }
    );
  }

  // TODO For debug in prod, cleanup when done
  console.log("MOESIF - middleware - headers.set('X-Adamik-Customer-Id', client.clientId):", client.clientId);

  const headers = new Headers(request.headers);
  headers.set("X-Adamik-Customer-Id", client.clientId || "unknown");

  return NextResponse.next({
    // Override request headers with the specified new ones
    // NB: although we "return" a response, this actually gets forwarded to the route
    request: {
      headers,
    },
  });
}

// Limit the middleware to paths starting with `/api/`
export const config = {
  matcher: "/api/:function*",
};
