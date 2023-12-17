import { encodeAddress } from "../logic";

function pubkeyToAddress(pubkey: string): string {
  return encodeAddress(Buffer.from(pubkey, "hex"));
}

export { pubkeyToAddress };
