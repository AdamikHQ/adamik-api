import { NextResponse } from "next/server";

export const GET = async (request: Request, context: { params: { userId: string } }) => {
  const expirationDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
  const url = `https://api.moesif.com/v1/portal/~/workspaces/670fa5b95a8373675cbb1796/access_token?expiration=${expirationDate}`;
  const options = {
    method: "POST",
    headers: {
      Authorization:
        "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhcHAiOiI0OTM6MTUzOCIsInN1YiI6Imdvb2dsZS1vYXV0aDJ8MTA4MTA4MDU0NzYxNTk2MjQzOTMzIiwiYXVkIjoiNnVaMG5PamZycjhOSWo0cjhJNk5OdXJTdkY3VlkybUwiLCJ2ZXIiOiIxIiwib3JnIjoiMTE2OjU5MSIsInBlcm1pc3Npb25zIjp7IjExNjo1OTEiOnsic2NwIjoicmVhZDp3b3Jrc3BhY2VzIn19LCJpc3MiOiJodHRwczovL3d3dy5tb2VzaWYuY29tL3dyYXAvYXBwLzExNjo1OTEtNDkzOjE1MzgiLCJpYXQiOjE3MjkwMzY4MDAsImp0aSI6Ijc2NGRmOWIwLWI4ZWMtNGI4YS1hOWRhLWU3NmYyN2Q1NGZhZiJ9.y-oSFs4Mxmfs_OTTuHH6Soq3G-wFWZ0BvbUyySrhJaA",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ template: { values: { user_id: context.params.userId } } }),
  };

  try {
    const response = await fetch(encodeURI(url), options);
    return NextResponse.json(await response.json());
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message, status: 500 });
    console.error(error);
  }
};
