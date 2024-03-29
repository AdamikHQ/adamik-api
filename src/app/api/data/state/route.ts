import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { services } from "~/app/families/services";
import "~/app/patch";
import { postDataStateSchema } from "./schema";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.json();
  try {
    postDataStateSchema.parse(body);
  } catch (e) {
    if (e instanceof ZodError) {
      return NextResponse.json(
        { message: "invalid request", errors: e.errors },
        { status: 400, statusText: "Invalid or missing fields" }
      );
    }
    throw e;
  }
  const { chainId, address } = body;

  const service = services.get(chainId);
  if (!service) {
    return new NextResponse(null, {
      status: 501,
      statusText: `Unsupported chain: ${chainId}`,
    });
  }

  const isAddressValid = await service.validateAddress(chainId, address);
  if (!isAddressValid) {
    return NextResponse.json(
      { message: "address is invalid" },
      { status: 400, statusText: "Invalid or missing fields" }
    );
  }

  const state = await service.getAddressState(chainId, address);

  return NextResponse.json(state);
}
