import { keccak256 } from "js-sha3";
import { TronWeb } from "tronweb";
import { TypedAddress } from "~/app/model/types_WIP";
import { TronService } from "../service";

async function pubkeyToAddresses(this: TronService, pubkey: string): Promise<TypedAddress[]> {
  const cleanPubkey = pubkey.replace("0x", "");

  const pubkeyBuffer = Buffer.from(cleanPubkey, "hex");
  const pubkeyWithoutPrefix = pubkeyBuffer.slice(pubkeyBuffer.length === 65 ? 1 : 0);

  const hash: string = keccak256(pubkeyWithoutPrefix);

  const addressHex: string = `41${hash.slice(-40)}`;

  const base58Address: string = TronWeb.address.fromHex(addressHex);

  return [{ address: base58Address, type: "default" }];
}

export { pubkeyToAddresses };
