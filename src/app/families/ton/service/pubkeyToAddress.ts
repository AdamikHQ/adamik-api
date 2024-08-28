import { TonService } from ".";

async function pubkeyToAddress(this: TonService, pubkey: string): Promise<string> {
  return pubkey;
}

export { pubkeyToAddress };
