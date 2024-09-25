import { TypedAddress } from "~/app/model/types_WIP";
import { TronService } from ".";

async function pubkeyToAddresses(this: TronService, pubkey: string): Promise<TypedAddress[]> {
  throw new Error("Not implemented");
}

export { pubkeyToAddresses };
