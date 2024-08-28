import { CosmosService } from ".";

async function pubkeyToAddresses(this: CosmosService, pubkey: string): Promise<Record<string, string>> {
  throw new Error("Not implemented");
}

export { pubkeyToAddresses };
