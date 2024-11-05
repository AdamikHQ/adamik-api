import { WalletContractV1R3, WalletContractV2R2, WalletContractV3R2, WalletContractV4 } from "@ton/ton";
import { TypedAddress } from "~/app/model/types_WIP";
import { TonService } from "../service";

async function pubkeyToAddresses(this: TonService, pubkey: string): Promise<TypedAddress[]> {
  return [
    {
      type: "walletv1r3",
      address: WalletContractV1R3.create({
        workchain: 0,
        publicKey: Buffer.from(pubkey, "hex"),
      }).address.toString(),
    },
    {
      type: "walletv2r2",
      address: WalletContractV2R2.create({
        workchain: 0,
        publicKey: Buffer.from(pubkey, "hex"),
      }).address.toString(),
    },
    {
      type: "walletv3r2",
      address: WalletContractV3R2.create({
        workchain: 0,
        publicKey: Buffer.from(pubkey, "hex"),
      }).address.toString(),
    },
    {
      type: "walletv4",
      address: WalletContractV4.create({
        workchain: 0,
        publicKey: Buffer.from(pubkey, "hex"),
      }).address.toString(),
    },
  ];
}

export { pubkeyToAddresses };
