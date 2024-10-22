import { setupServer } from "msw/node";

export const handlers = [];

export const server = setupServer(...handlers);

server.events.on("request:start", async ({ request, requestId }) => {
  console.log("Outgoing request:", request.method, request.url);

  const payload = await request.clone().json();

  console.log({ payload });
});

server.events.on("response:bypass", async ({ request, requestId, response }) => {
  console.log("Response bypass:", request.method, request.url, request.headers);

  console.log({ response, res: await response.json() });
});
