import { DeployContractType, TypedAddress } from "~/app/model/types_WIP";
import { ArgentX } from "../contracts/argentx";
import { extractX } from "../logic";
import { StarknetService } from "../service";

async function pubkeyToAddresses(this: StarknetService, pubkey: string): Promise<TypedAddress[]> {
  const sanitizedPubkey = extractX(pubkey);

  return [
    // {
    //   type: "openzeppelin",
    //   address: OpenZeppelin.generateAddress(pubkey),
    // },
    {
      type: DeployContractType.ARGENTX,
      address: ArgentX.generateAddress(sanitizedPubkey),
    },
    // TODO: Uncomment when braavos match calculated address
    // {
    //   type: "braavos",
    //   address: Braavos.generateAddress(pubkey),
    // },
  ];
}

export { pubkeyToAddresses };
