import { CallData, hash } from "starknet";
import { Contract } from "./types";

class ArgentX implements Contract {
  static generateAddress(pubkey: string): string {
    const argentXConstructorCallData = CallData.compile({
      owner: pubkey,
      guardian: "0",
    });

    const argentXaccountClassHash = "0x1a736d6ed154502257f02b1ccdf4d9d1089f80811cd6acad48e6b6a9d1f2003";

    const argentXcontractAddress = hash.calculateContractAddressFromHash(
      pubkey,
      argentXaccountClassHash,
      argentXConstructorCallData,
      0
    );

    return argentXcontractAddress;
  }
}

export { ArgentX };
