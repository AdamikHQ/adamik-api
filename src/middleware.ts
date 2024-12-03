import { NextRequest, NextResponse } from "next/server";
import { env } from "~/env";
export async function middleware(request: NextRequest) {
  const isPreflight = request.method === "OPTIONS";
  if (isPreflight) {
    return NextResponse.json({});
  }

  const apiKey = request.headers.get("Authorization");
  // TODO Use postgres instead of edge config
  // const clients: readonly ClientData[] | undefined = await getVercelEdgeConfig("clients");
  // const client = clients?.find((client) => client.apiKey === apiKey);
  const response = await fetch(`${env.HOST_URL}/api/authorize?apiKey=${apiKey}`);
  const client: { clientId: string | undefined } = await response.json();

  // NOTE No additional checks for now
  // In the future we could apply rate limits, or special access rights
  if (!client.clientId) {
    return NextResponse.json(
      { message: `Missing or invalid API key` },
      { status: 401, statusText: `Unauthorized` }
    );
  }

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
