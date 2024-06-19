import { encodeAddress } from "../logic";
import { AlgorandService } from ".";

async function pubkeyToAddresses(this: AlgorandService, pubkey: string): Promise<string[]> {
  return [encodeAddress(Buffer.from(pubkey, "hex"))];
}

export { pubkeyToAddresses };
