import { NextRequest, NextResponse } from "next/server";
import { get as getVercelEdgeConfig } from "@vercel/edge-config";
import { env } from "./env";

type ClientData = {
  clientId: string; // adamik generated ID
  apiKey: string;
  creationDate: number;
  nickname: string; // for display purposes only
  stripeCustomerId: string;
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

  // NOTE No additional checks for now
  // In the future we could apply rate limits, or special access rights
  if (!client) {
    return NextResponse.json(
      { message: `Missing or invalid API key` },
      { status: 401, statusText: `Unauthorized` }
    );
  }

  const headers = new Headers(request.headers);
  headers.set("X-Adamik-Customer-Id", client.clientId || "unknown");

  // Retrieve customer's subscription plan to determine if it's a free or paid user
  try {
    // https://www.moesif.com/docs/api?javascript#getcompanysubscriptions
    const company = await fetch(
      `https://api.moesif.com/v1/search/~/companies/${client.clientId}/subscriptions`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${env.MOESIF_MANAGEMENT_API_KEY}`,
        },
      }
    ).then((response) => response.json());

    const plan = company?.subscriptions[0]?.items[0]?.plan_id;

    headers.set("X-Adamik-Plan-Type", plan === "prod_R7omOL9I6NpP2H" ? "paid" : "free"); // FIXME: get the plan id from Stripe dashboard
  } catch (e) {
    console.warn("Error while fetching user plan:", e);
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
