import { isValidAddress } from "algosdk";
import { AlgorandService } from ".";

/**
 * Validates an Algorand address.
 * @param {string} address - The Algorand address to validate.
 * @returns {Promise<boolean>} - Returns true if the address is valid, false otherwise.
 */
async function validateAddress(this: AlgorandService, address: string): Promise<boolean> {
  try {
    // Remove '0x' prefix if present
    const cleanAddress = address.startsWith("0x") ? address.slice(2) : address;

    // Check if the address is a valid Algorand address (Base32)
    if (/^[A-Z2-7]{58}$/.test(cleanAddress)) {
      return isValidAddress(cleanAddress);
    }

    // If it doesn't match the Base32 format, it's not a valid Algorand address
    return false;
  } catch (error) {
    console.error(
      `Error validating Algorand address: ${error instanceof Error ? error.message : "Unknown error"}`
    );
    return false;
  }
}

export { validateAddress };
