import { NextResponse } from "next/server";
import { CHAINS } from "~/app/config/chains";

/**
 * @swagger
 * /api/chains:
 *   get:
 *     description: Return supported chains
 *     responses:
 *       200:
 *          description: list of supported chains
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(Object.keys(CHAINS));
}
