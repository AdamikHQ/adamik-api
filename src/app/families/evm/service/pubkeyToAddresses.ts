import { computeAddress } from "ethers"; // Import from ethers
import { TypedAddress } from "~/app/model/types_WIP";
import { EvmService } from ".";
import { EvmAddress } from "../types";

// Converts an EVM public key to an Ethereum-like address
async function pubkeyToAddresses(this: EvmService, pubkey: string): Promise<TypedAddress[]> {
  try {
    const publicKeyHex = normalizePublicKey(pubkey);
    validatePublicKey(publicKeyHex);

    const address = computeAddress("0x" + publicKeyHex) as EvmAddress;
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

function validatePublicKey(publicKeyHex: string): void {
  if (publicKeyHex.length === 66 && (publicKeyHex.startsWith("02") || publicKeyHex.startsWith("03"))) {
    throw new Error("Compressed public key detected. Please provide an uncompressed public key.");
  }
  if (publicKeyHex.length !== 130 || !publicKeyHex.startsWith("04")) {
    throw new Error("Unsupported public key format or incorrect length.");
  }
}

function handleError(error: unknown): never {
  if (error instanceof Error) {
    throw new Error(`Error in pubkeyToAddresses (EVM): ${error.message}`);
  } else {
    throw new Error("Failed to convert public key to EVM addresses.");
  }
}

export { pubkeyToAddresses };
