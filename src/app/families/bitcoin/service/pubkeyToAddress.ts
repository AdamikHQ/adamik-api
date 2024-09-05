import { BitcoinService } from ".";

async function pubkeyToAddress(this: BitcoinService, pubkey: string): Promise<string> {
  throw new Error("Not implemented");
}

export { pubkeyToAddress };
