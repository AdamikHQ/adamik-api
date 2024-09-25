import { computeAddress } from "ethers"; // Import from ethers
import { TypedAddress } from "~/app/model/types_WIP";
import { EvmService } from ".";
import { EvmAddress } from "../types";

// Converts an EVM public key to an Ethereum-like address
async function pubkeyToAddresses(this: EvmService, pubkey: string): Promise<TypedAddress[]> {
  try {
    let publicKeyHex: string;

    // Handle different formats: Base64 or hex (with or without '0x' prefix)
    if (!pubkey.startsWith("0x") && pubkey.length !== 130 && pubkey.length !== 66) {
      publicKeyHex = Buffer.from(pubkey, "base64").toString("hex").trim(); // Base64 encoded public key (trim any spaces)
      console.log("Converted Base64 to hex:", publicKeyHex);
    } else {
      publicKeyHex = pubkey.startsWith("0x") ? pubkey.slice(2).trim() : pubkey.trim(); // Strip '0x' if present
    }

    // Log the length and content of publicKeyHex for debugging
    console.log("Public key length:", publicKeyHex.length);
    console.log("Public key content:", publicKeyHex);

    // Check if the public key is compressed (66 hex characters, starting with '02' or '03')
    if (publicKeyHex.length === 66 && (publicKeyHex.startsWith("02") || publicKeyHex.startsWith("03"))) {
      console.log("Compressed public key detected");
      throw new Error("Compressed public key detected. Please provide an uncompressed public key.");
    }

    // Check if the public key is uncompressed (130 hex characters, starting with '04')
    if (publicKeyHex.length === 130 && publicKeyHex.startsWith("04")) {
      console.log("Uncompressed public key detected");
      // We pass the full uncompressed key, `computeAddress` expects it
    } else {
      throw new Error("Unsupported public key format or incorrect length.");
    }

    // Compute the Ethereum address using ethers.js
    const address = computeAddress("0x" + publicKeyHex) as EvmAddress;

    // Return the address in the expected format
    return [{ address, type: "default" }];
  } catch (error: unknown) {
    // Safely handle unknown error type
    if (error instanceof Error) {
      console.error(`Error in pubkeyToAddresses (EVM): ${error.message}`);
      throw new Error(error.message);
    } else {
      console.error("An unknown error occurred in pubkeyToAddresses (EVM).");
      throw new Error("Failed to convert public key to EVM addresses.");
    }
  }
}

export { pubkeyToAddresses };
