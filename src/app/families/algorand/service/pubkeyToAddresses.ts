import { encodeAddress } from "algosdk";
import { TypedAddress } from "~/app/model/types_WIP";
import { AlgorandService } from ".";

async function pubkeyToAddresses(this: AlgorandService, pubkey: string): Promise<TypedAddress[]> {
  const address = encodeAddress(Buffer.from(pubkey, "hex"));

  return [
    {
      type: "default",
      address,
    },
  ];
}

export { pubkeyToAddresses };
