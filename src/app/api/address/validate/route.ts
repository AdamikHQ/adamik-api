import { NextResponse } from "next/server";
import { getService } from "~/app/families/services";
import { apiHandlerWrapper } from "~/app/tools/handlers/apiHandler";
import { requestSchema, responseSchema } from "./schema";

export const POST = apiHandlerWrapper(async ({ chainId, address }) => {
  const service = getService(chainId);

  const isValid = await service.validateAddress(address);

  return NextResponse.json(isValid);
}, {
  requestSchema,
  responseSchema
});
