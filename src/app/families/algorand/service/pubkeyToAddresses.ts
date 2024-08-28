import { AlgorandService } from ".";

async function pubkeyToAddresses(this: AlgorandService, pubkey: string): Promise<Record<string, string>> {
  throw new Error("Not implemented");
}

export { pubkeyToAddresses };
