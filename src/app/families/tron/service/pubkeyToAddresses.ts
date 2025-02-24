import { TypedAddress } from "~/app/model/types_WIP";
import { UnsupportedFeatureError } from "~/app/tools/handlers/errors";
import { TronService } from "../service";

async function pubkeyToAddresses(this: TronService, pubkey: string): Promise<TypedAddress[]> {
  throw new UnsupportedFeatureError("Not implemented yet");
}

export { pubkeyToAddresses };
