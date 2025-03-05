import { ec as EC } from "elliptic";
import { keccak256 } from "js-sha3";
import { TronWeb } from "tronweb";
import { TypedAddress } from "~/app/model/types_WIP";
import { TronService } from "../service";

async function pubkeyToAddresses(this: TronService, pubkey: string): Promise<TypedAddress[]> {
  const cleanPubkey = pubkey.startsWith("0x") ? pubkey.slice(2) : pubkey;

  if (!/^[0-9a-fA-F]+$/.test(cleanPubkey)) {
    throw new Error("Invalid public key format. Expected a hex-encoded string.");
  }

  // Initialize elliptic curve
  const ec = new EC("secp256k1");

  // Convert the public key to a point on the curve
  const key = ec.keyFromPublic(cleanPubkey, "hex");

  // Get the uncompressed public key (always starts with 04)
  const uncompressedPubkey = key.getPublic(false, "hex");

  // Remove the '04' prefix
  const pubkeyWithoutPrefix = Buffer.from(uncompressedPubkey.slice(2), "hex");

  const hash: string = keccak256(pubkeyWithoutPrefix);
  const addressHex: string = `41${hash.slice(-40)}`;
  const base58Address: string = TronWeb.address.fromHex(addressHex);

  return [{ address: base58Address, type: "default" }];
}

export { pubkeyToAddresses };
