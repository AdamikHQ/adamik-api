import { TypedAddress } from "~/app/model/types_WIP";
import { Argent } from "../contracts/argent";
import { Bravoos } from "../contracts/bravoos";
import { OpenZeppelin } from "../contracts/openzeppelin";
import { StarknetService } from "../service";

async function pubkeyToAddresses(this: StarknetService, pubkey: string): Promise<TypedAddress[]> {
  return [
    {
      type: "openzeppelin",
      address: OpenZeppelin.generateAddress(pubkey),
    },
    {
      type: "argent",
      address: Argent.generateAddress(pubkey),
    },
    {
      type: "bravoos",
      address: Bravoos.generateAddress(pubkey),
    },
  ];
}

export { pubkeyToAddresses };
