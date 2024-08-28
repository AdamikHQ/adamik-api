import { EvmService } from ".";

async function pubkeyToAddresses(this: EvmService, pubkey: string): Promise<Record<string, string>> {
  throw new Error("Not implemented");
}

export { pubkeyToAddresses };
