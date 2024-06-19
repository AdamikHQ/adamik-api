import { EvmService } from ".";

async function pubkeyToAddresses(this: EvmService, pubkey: string): Promise<string[]> {
  throw new Error("Not implemented");
}

export { pubkeyToAddresses };
