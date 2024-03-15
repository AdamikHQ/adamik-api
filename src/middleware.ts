import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const apiKey = request.headers.get("X-Api-Key");
  if (request.method !== "OPTIONS" && apiKey !== process.env.NEXT_PUBLIC_DEFAULT_API_KEY) {
    return new NextResponse(null, {
      status: 401,
      statusText: "Missing or invalid API key",
    });
  }
}

// Limit the middleware to paths starting with `/api/`
export const config = {
  matcher: "/api/:function*",
};
