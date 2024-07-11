import { NextResponse } from "next/server";
import { getService } from "~/app/families/services";
import { apiHandlerWrapper } from "~/app/tools/handlers/apiHandler";
import { requestSchema, responseSchema } from "./schema";

export const POST = apiHandlerWrapper(async ({ chainId, pubkey }) => {
  const service = getService(chainId);

  const address = await service.pubkeyToAddress(pubkey);

  return NextResponse.json(address);
}, {
  requestSchema,
  responseSchema
});
