import { TonService } from "./service";

async function pubkeyToAddress(this: TonService, pubkey: string): Promise<string> {
  throw new Error("Not implemented, please use /addresses/encode");
}

export { pubkeyToAddress };
