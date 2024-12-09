import { CallData, hash } from "starknet";
import { Contract } from "./types";

class Braavos implements Contract {
  static generateAddress(pubkey: string): string {
    const braavosProxyClassHash = "0x03131fa018d520a037686ce3efddeab8f28895662f019ca3ca18a626650f7d1e";
    const braavosInitialClassHash = "0x5aa23d5bb71ddaa783da7ea79d405315bafa7cf0387a74f4593578c3e9e6570";

    const braavosInitializer = CallData.compile({ public_key: pubkey });

    const braavosProxyConstructorCallData = CallData.compile({
      implementation_address: braavosInitialClassHash,
      initializer_selector: hash.getSelectorFromName("initializer"),
      calldata: [...braavosInitializer],
    });

    return hash.calculateContractAddressFromHash(
      pubkey,
      braavosProxyClassHash,
      braavosProxyConstructorCallData,
      0
    );
  }
}

export { Braavos };
