import { BtcService } from ".";

async function pubkeyToAddresses(this: BtcService, pubkey: string): Promise<Record<string, string>> {
  throw new Error("Not implemented");
}

export { pubkeyToAddresses };
