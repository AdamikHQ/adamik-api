import { WalletContractV1R3, WalletContractV2R2, WalletContractV3R2, WalletContractV4 } from "@ton/ton";
import { TonService } from "./service";

async function pubkeyToAddresses(this: TonService, pubkey: string): Promise<Record<string, string>> {
  return {
    walletv1r3: WalletContractV1R3.create({
      workchain: 0,
      publicKey: Buffer.from(pubkey, "hex"),
    }).address.toString(),
    walletv2r2: WalletContractV2R2.create({
      workchain: 0,
      publicKey: Buffer.from(pubkey, "hex"),
    }).address.toString(),
    walletv3r2: WalletContractV3R2.create({
      workchain: 0,
      publicKey: Buffer.from(pubkey, "hex"),
    }).address.toString(),
    walletv4: WalletContractV4.create({
      workchain: 0,
      publicKey: Buffer.from(pubkey, "hex"),
    }).address.toString(),
  };
}

export { pubkeyToAddresses };
