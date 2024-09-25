import { computeAddress } from "ethers";
import { TypedAddress } from "~/app/model/types_WIP";
import { EvmService } from ".";
import { EvmAddress } from "../types";

// Converts an EVM public key to an Ethereum-like address
async function pubkeyToAddresses(this: EvmService, pubkey: string): Promise<TypedAddress[]> {
  try {
    const publicKeyHex = normalizePublicKey(pubkey);
    const validatedKey = validatePublicKey(publicKeyHex);

    const address = computeAddress("0x" + validatedKey) as EvmAddress;
    return [{ address, type: "default" }];
  } catch (error: unknown) {
    handleError(error);
  }
}

function normalizePublicKey(pubkey: string): string {
  if (!pubkey.startsWith("0x") && pubkey.length !== 130 && pubkey.length !== 66) {
    return Buffer.from(pubkey, "base64").toString("hex").trim();
  }
  return pubkey.startsWith("0x") ? pubkey.slice(2).trim() : pubkey.trim();
}

function validatePublicKey(publicKeyHex: string): string {
  if (publicKeyHex.length === 66 && (publicKeyHex.startsWith("02") || publicKeyHex.startsWith("03"))) {
    return uncompressPublicKey(publicKeyHex);
  }
  if (publicKeyHex.length !== 130 || !publicKeyHex.startsWith("04")) {
    throw new Error("Unsupported public key format or incorrect length.");
  }
  return publicKeyHex;
}

function uncompressPublicKey(compressedKey: string): string {
  const secp256k1 = require("secp256k1");

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
