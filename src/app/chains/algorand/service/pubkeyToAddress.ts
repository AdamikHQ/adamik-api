import { encodeAddress } from "../logic";

async function pubkeyToAddress(pubkey: string): Promise<string> {
  return encodeAddress(Buffer.from(pubkey, "hex"));
}

export { pubkeyToAddress };
