import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const apiKey = request.headers.get("X-Api-Key");
  const isPreflight = request.method === "OPTIONS";

  if (isPreflight) {
    return NextResponse.json({});
  }

  if (apiKey !== process.env.NEXT_PUBLIC_DEFAULT_API_KEY) {
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
