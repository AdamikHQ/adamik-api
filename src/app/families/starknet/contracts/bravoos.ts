import { CallData, hash } from "starknet";
import { Contract } from "./types";

class Bravoos implements Contract {
  static generateAddress(pubkey: string): string {
    const BraavosProxyClassHash = "0x03131fa018d520a037686ce3efddeab8f28895662f019ca3ca18a626650f7d1e";
    const BraavosInitialClassHash = "0x5aa23d5bb71ddaa783da7ea79d405315bafa7cf0387a74f4593578c3e9e6570";

    const BraavosInitializer = CallData.compile({ public_key: pubkey });

    const BraavosProxyConstructorCallData = CallData.compile({
      implementation_address: BraavosInitialClassHash,
      initializer_selector: hash.getSelectorFromName("initializer"),
      calldata: [...BraavosInitializer],
    });

    return hash.calculateContractAddressFromHash(
      pubkey,
      BraavosProxyClassHash,
      BraavosProxyConstructorCallData,
      0
    );
  }
}

export { Bravoos };
