import { TypedAddress } from "~/app/model/types_WIP";
import { ArgentX } from "../contracts/argentx";
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
      address: ArgentX.generateAddress(pubkey),
    },
    // TODO: Uncomment when braavos match calculated address
    // {
    //   type: "braavos",
    //   address: Braavos.generateAddress(pubkey),
    // },
  ];
}

export { pubkeyToAddresses };
