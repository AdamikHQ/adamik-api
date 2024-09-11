import { BitcoinService } from ".";

async function pubkeyToAddresses(this: BitcoinService, pubkey: string): Promise<Record<string, string>> {
  throw new Error("Not implemented");
}

export { pubkeyToAddresses };

