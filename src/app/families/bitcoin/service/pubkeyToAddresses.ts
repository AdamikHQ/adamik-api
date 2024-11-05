import { TypedAddress } from "~/app/model/types_WIP";
import { BitcoinService } from "../service";

async function pubkeyToAddresses(this: BitcoinService, pubkey: string): Promise<TypedAddress[]> {
  throw new Error("Not implemented");
}

export { pubkeyToAddresses };
