import { DeployContractType, TypedAddress } from "~/app/model/types_WIP";
import { ArgentX } from "../contracts/argentx";
import { StarknetService } from "../service";

async function pubkeyToAddresses(this: StarknetService, pubkey: string): Promise<TypedAddress[]> {
  return [
    // {
    //   type: "openzeppelin",
    //   address: OpenZeppelin.generateAddress(pubkey),
    // },
    {
      type: DeployContractType.ARGENTX,
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
