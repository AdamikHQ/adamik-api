import { CallData, hash } from "starknet";
import { generateAddress } from "./types";

class OpenZeppelin {
  static generateAddress: generateAddress = (pubkey: string): string => {
    const ozAccountClassHash = "0x061dac032f228abef9c6626f995015233097ae253a7f72d68552db02f2971b8f";
    // Calculate future address of the account
    const ozAccountConstructorCallData = CallData.compile({ publicKey: pubkey });
    const ozContractAddress = hash.calculateContractAddressFromHash(
      pubkey,
      ozAccountClassHash,
      ozAccountConstructorCallData,
      0
    );

    return ozContractAddress;
  };
}

export { OpenZeppelin };
