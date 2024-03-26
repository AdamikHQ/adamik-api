import { NextRequest, NextResponse } from "next/server";
import { ChainId } from "~/app/model/types_WIP";
import { CHAINS } from "~/app/config/chains";

/**
 * @swagger
 * /api/chains/{chainId}:
 *   get:
 *     description: Return config for a specific chain
 *     parameters:
 *       - name: chainId
 *         description: chain id.
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *          description: config for a specific chain
 *       400:
 *          description: formating error
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const urlNodes = request.url.split("/");
  const chainId = urlNodes[urlNodes.length - 1];

  if (!chainId) {
    return new NextResponse(null, {
      status: 400,
      statusText: "Path param `chainId` is required",
    });
  }
  if (!Object.keys(CHAINS).includes(chainId)) {
    return new NextResponse(null, {
      status: 400,
      statusText: `Unsupported chain '${chainId}'`,
    });
  }

  return NextResponse.json(CHAINS[chainId as ChainId]);
}
