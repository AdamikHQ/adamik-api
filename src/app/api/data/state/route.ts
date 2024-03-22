import "~/app/patch";
import { NextRequest, NextResponse } from "next/server";
import { services } from "~/app/families/services";
import { z, ZodError } from "zod";

export async function POST(request: NextRequest, res: NextResponse): Promise<NextResponse> {
  // TODO validation/sanitization (validateAddress)
  try {
    const schema = z.object({
      chainId: z.string().min(1),
      address: z.string().min(1),
    });
    const body = await request.json();
    schema.parse(body);

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
  } catch (e) {
    if (e instanceof ZodError) {
      return NextResponse.json(
        { message: "invalid request", errors: e.errors },
        { status: 400, statusText: "Invalid or missing fields" }
      );
    }
    throw e;
  }
}
