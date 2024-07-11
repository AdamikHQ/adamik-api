import { NextResponse } from "next/server";
import { getService } from "~/app/families/services";
import { deepBigintToString } from "~/app/tools/convertors/deepBigintToString";
import { apiHandlerWrapper } from "~/app/tools/handlers/apiHandler";
import { requestSchema, responseSchema } from "./schema";

export const POST = apiHandlerWrapper(async ({ chainId, address }) => {
  const service = getService(chainId);

  const isAddressValid = await service.validateAddress(address);

  if (!isAddressValid) {
    return NextResponse.json(
      { message: "Address is invalid" },
      { status: 400, statusText: "Invalid or missing fields" }
    );
  }

  const state = await service.getAddressState(address);

  return NextResponse.json(deepBigintToString(state));
}, {
  requestSchema,
  responseSchema
});
