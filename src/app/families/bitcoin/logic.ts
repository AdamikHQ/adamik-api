import { address as addressSerde, initEccLib, networks } from "bitcoinjs-lib";
import { ChainId } from "~/app/model/types_WIP";
import * as ecc from "tiny-secp256k1";
import { Xpub } from "./types";

// Allows support for Taproot addresses validation: https://github.com/bitcoinjs/bitcoinjs-lib/issues/1919
initEccLib(ecc);

// Looks like a hack but it's actually the best way to check if the address is valid
// https://github.com/andcoisqu/bitcoinjs-lib/blob/d4b57292995f9233fc0b4ed9e4dfda3be85d3e19/test/integration/addresses.js#L100
//    also could maybe use instead https://github.com/caravan-bitcoin/caravan/blob/3448d9569d8b657297205ea4b0b041beabbf3f94/packages/caravan-bitcoin/src/addresses.ts#L24
export function isValidAddress(address: string, _chainId: ChainId): boolean {
  // TODO: support other networks (i.e testnet, litecoin... etc)
  const network = networks.bitcoin;
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

// FIXME: well want to validate also the xpub prefix with chainId (make sure that lpub are not used for BTC for example)
export function isValidXpub(str: string): str is Xpub {
  return xpubRegex.test(str);
}
