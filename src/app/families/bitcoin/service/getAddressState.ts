import { AddressState, TokenAmount } from "~/app/model/types_WIP";
import { BtcService } from ".";

async function getAddressState(this: BtcService, address: string): Promise<AddressState> {
  throw new Error("Not implemented");
}

export { getAddressState };
