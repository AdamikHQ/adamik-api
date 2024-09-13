import ecc from "@bitcoinerlab/secp256k1";
import { address as addressSerde, initEccLib, networks } from "bitcoinjs-lib";
import { ChainId } from "~/app/model/types_WIP";
import { Xpub } from "./types";

// Allows support for Taproot addresses validation: https://github.com/bitcoinjs/bitcoinjs-lib/issues/1919
initEccLib(ecc);

export function selectNetworkForChainId(chainId: ChainId): networks.Network {
  switch (chainId) {
    case ChainId.BITCOIN:
    case ChainId.BITCOIN_TESTNET:
      return networks.bitcoin;
    case ChainId.LITECOIN:
      // from https://github.com/bitcoinjs/bitcoinjs-lib/blob/34e1644b5fb60055793ec3078f2e4f48b2648ca6/test/address.spec.ts#L14
      return {
        messagePrefix: "\x19Litecoin Signed Message:\n",
        bech32: "ltc",
        bip32: {
          public: 0x019da462,
          private: 0x019d9cfe,
        },
        pubKeyHash: 0x30,
        scriptHash: 0x32,
        wif: 0xb0,
      };
    default:
      throw new Error("Not implemented");
  }
}

// Looks like a hack but it's actually the best way to check if the address is valid
// https://github.com/andcoisqu/bitcoinjs-lib/blob/d4b57292995f9233fc0b4ed9e4dfda3be85d3e19/test/integration/addresses.js#L100

export function isValidAddress(chainId: ChainId, address: string): boolean {
  const network = selectNetworkForChainId(chainId);
  try {
    // this will throw an error if the address is invalid
    addressSerde.toOutputScript(address, network);
    return true;
  } catch (error) {
    return false;
  }
}

const xpubRegex =
  /^([xyYzZtuUvV]pub[1-9A-HJ-NP-Za-km-z]{79,108})(?:(?:$|\?)((?!.*&c=)c=\d{10}|(?!.*&h=)h=bip\d{2,3})(?:(?=(?:&c=|&h=))&(c=\d{10}|h=bip\d{2,3}))?)?$/;

// FIXME: we'll want to validate also the xpub prefix with chainId (make sure that lpub are not used for BTC for example)
export function isValidXpub(_chainId: ChainId, str: string): str is Xpub {
  return xpubRegex.test(str);
}
