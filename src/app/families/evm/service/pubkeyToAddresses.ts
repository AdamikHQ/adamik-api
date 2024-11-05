import { computeAddress } from "ethers";
import { TypedAddress } from "~/app/model/types_WIP";
import { EvmService } from "../service";
import { EvmAddress } from "../types";

const secp256k1 = require("secp256k1");

// Converts an EVM public key to an Ethereum-like address
async function pubkeyToAddresses(this: EvmService, pubkey: string): Promise<TypedAddress[]> {
  try {
    const validatedKey = validatePublicKey(pubkey);
    const address = computeAddress("0x" + validatedKey) as EvmAddress;
    return [{ address, type: "default" }];
  } catch (error: unknown) {
    handleError(error);
  }
}

function validatePublicKey(pubkey: string): string {
  const cleanPubkey = pubkey.startsWith("0x") ? pubkey.slice(2) : pubkey;

  if (!/^[0-9a-fA-F]+$/.test(cleanPubkey)) {
    throw new Error("Invalid public key format. Expected a hex-encoded string.");
  }

  if (cleanPubkey.length === 130 && cleanPubkey.startsWith("04")) {
    return cleanPubkey;
  } else if (cleanPubkey.length === 66 && (cleanPubkey.startsWith("02") || cleanPubkey.startsWith("03"))) {
    return uncompressPublicKey(cleanPubkey);
  } else {
    throw new Error(
      "Invalid public key length. Expected 66 characters for compressed keys or 130 characters for uncompressed keys (excluding '0x' prefix if present)."
    );
  }
}

function uncompressPublicKey(compressedKey: string): string {
  const compressedKeyBytes = Uint8Array.from(Buffer.from(compressedKey, "hex"));
  const uncompressedKeyBytes = secp256k1.publicKeyConvert(compressedKeyBytes, false);
  const uncompressedKey = Buffer.from(uncompressedKeyBytes).toString("hex");

  return "04" + uncompressedKey.slice(2);
}

function handleError(error: unknown): never {
  if (error instanceof Error) {
    throw new Error(`Error in pubkeyToAddresses (EVM): ${error.message}`);
  } else {
    throw new Error("Failed to convert public key to EVM addresses.");
  }
}

export { pubkeyToAddresses };
