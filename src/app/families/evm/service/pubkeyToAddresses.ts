import { TypedAddress } from "~/app/model/types_WIP";
import { EvmService } from ".";

async function pubkeyToAddresses(this: EvmService, pubkey: string): Promise<TypedAddress[]> {
  throw new Error("Not implemented");
}

export { pubkeyToAddresses };
