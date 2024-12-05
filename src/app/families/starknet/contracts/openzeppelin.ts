import { CallData, hash } from "starknet";
import { Contract } from "./types";

class OpenZeppelin implements Contract {
  static generateAddress(pubkey: string): string {
    const OZaccountClassHash = "0x061dac032f228abef9c6626f995015233097ae253a7f72d68552db02f2971b8f";
    // Calculate future address of the account
    const OZaccountConstructorCallData = CallData.compile({ publicKey: pubkey });
    const OZcontractAddress = hash.calculateContractAddressFromHash(
      pubkey,
      OZaccountClassHash,
      OZaccountConstructorCallData,
      0
    );

    return OZcontractAddress;
  }
}

export { OpenZeppelin };
