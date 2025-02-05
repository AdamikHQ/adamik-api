import { CallData, encode, hash } from "starknet";

class Braavos {
  static generateAddress = (pubkey: string): string => {
    const BraavosInitialClassHash = "0x5aa23d5bb71ddaa783da7ea79d405315bafa7cf0387a74f4593578c3e9e6570";
    const BraavosProxyClassHash = "0x03131fa018d520a037686ce3efddeab8f28895662f019ca3ca18a626650f7d1e";

    const braavosSigner = CallData.compile({ public_key: encode.sanitizeHex(pubkey) });
    const braavosConstructorCallData = CallData.compile({
      implementation_address: BraavosInitialClassHash,
      initializer_selector: hash.getSelectorFromName("initialize"),
      calldata: [...braavosSigner],
    });

    const address = hash.calculateContractAddressFromHash(
      encode.sanitizeHex(pubkey),
      BraavosProxyClassHash,
      braavosConstructorCallData,
      0
    );

    return encode.sanitizeHex(address);
  };
}

export { Braavos };
