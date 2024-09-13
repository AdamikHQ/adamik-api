import { TypedAddress } from "~/app/model/types_WIP";
import { CosmosService } from ".";

async function pubkeyToAddresses(this: CosmosService, pubkey: string): Promise<TypedAddress[]> {
  throw new Error("Not implemented");
}

export { pubkeyToAddresses };
