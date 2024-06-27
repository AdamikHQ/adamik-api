import { BtcService } from ".";

async function pubkeyToAddress(this: BtcService, pubkey: string): Promise<string> {
  throw new Error("Not implemented");
}

export { pubkeyToAddress };
