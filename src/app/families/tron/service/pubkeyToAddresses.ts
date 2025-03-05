import { ec as EC } from "elliptic";
import { computeAddress } from "ethers";
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

  // Get the ethereum address first (which uses keccak256 internally)
  const evmAddress = computeAddress("0x" + uncompressedPubkey);

  // Convert to TRON format by replacing '0x' with '41'
  const addressHex = "41" + evmAddress.slice(2);
  const base58Address = TronWeb.address.fromHex(addressHex);

  return [{ address: base58Address, type: "default" }];
}

export { pubkeyToAddresses };
