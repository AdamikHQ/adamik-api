import { address as addressSerde, networks } from "bitcoinjs-lib";
import { ChainId } from "~/app/model/types_WIP";

// Looks like a hack but it's actually the best way to check if the address is valid
// https://github.com/andcoisqu/bitcoinjs-lib/blob/d4b57292995f9233fc0b4ed9e4dfda3be85d3e19/test/integration/addresses.js#L100
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