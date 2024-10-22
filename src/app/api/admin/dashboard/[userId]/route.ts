import { NextResponse } from "next/server";
import { MOESIF_DASHBOARD_TOKEN } from "~/app/config/apiKeys";

export const GET = async (request: Request, context: { params: { userId: string } }) => {
  const userId = request.headers.get("X-Adamik-User-Id");
  const expirationDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
  const url = `https://api.moesif.com/v1/portal/~/workspaces/670fa5b95a8373675cbb1796/access_token?expiration=${expirationDate}`;
  const options = {
    method: "POST",
    headers: {
      Authorization: `Bearer ${MOESIF_DASHBOARD_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ template: { values: { user_id: userId } } }),
  };

  try {
    const response = await fetch(encodeURI(url), options);
    return NextResponse.json(await response.json());
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: (error as Error).message, status: 500 });
  }
};
