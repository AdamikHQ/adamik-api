import { TypedAddress } from "~/app/model/types_WIP";
import { TronService } from "../service";

async function pubkeyToAddresses(this: TronService, pubkey: string): Promise<TypedAddress[]> {
  throw new Error("Not implemented yet");
}

export { pubkeyToAddresses };
