import { ChainId } from "~/app/model/types_WIP";
import { encodeAddress } from "../logic";

async function pubkeyToAddress(chainId: ChainId, pubkey: string): Promise<string> {
  return encodeAddress(Buffer.from(pubkey, "hex"));
}

export { pubkeyToAddress };
