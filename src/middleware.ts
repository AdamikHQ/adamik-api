import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const isPreflight = request.method === "OPTIONS";
  if (isPreflight) {
    return NextResponse.json({});
  }

  const apiKey = request.headers.get("Authorization");

  // FIXME: This is a temporary solution to check if the API key is valid
  // https://github.com/vercel/next.js/discussions/71727
  // We hope that NextJS team will fix this issue soon
  const authorizeResponse = await fetch(
    `https://${
      process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL ?? "localhost:3000"
    }/api/authorize?apiKey=${apiKey}`
  );
  const client: { clientId: string | undefined } = await authorizeResponse.json();

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
