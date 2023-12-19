import { pubkeyToAddress } from "~/app/chains/algorand/service/pubkeyToAddress";

export async function POST(request: Request): Promise<Response> {
  // TODO validation/sanitization
  const { chain, pubkey } = await request.json();

  if (!chain) {
    return new Response(null, {
      status: 400,
      statusText: "Field `chain` is required",
    });
  }

  if (!pubkey) {
    return new Response(null, {
      status: 400,
      statusText: "Field `pubkey` is required",
    });
  }

  let address;
  switch (chain) {
    case "algorand":
      address = pubkeyToAddress(pubkey);
      break;
    default:
      return new Response(null, {
        status: 400,
        statusText: `Unsupported chain: ${chain}`,
      });
  }

  return new Response(JSON.stringify(address));
}
