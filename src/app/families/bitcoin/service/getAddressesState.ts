import { AddressState, AddressesState } from "~/app/model/types_WIP";
import { BtcService } from ".";
import { CHAINS } from "~/app/config/chains";
import { addressBalancesDataSchema } from "../backend/types";
import { z } from "zod";

const xpubRegex =
  /^([xyYzZtuUvV]pub[1-9A-HJ-NP-Za-km-z]{79,108})(?:(?:$|\?)((?!.*&c=)c=\d{10}|(?!.*&h=)h=bip\d{2,3})(?:(?=(?:&c=|&h=))&(c=\d{10}|h=bip\d{2,3}))?)?$/;

async function getAddressesState(this: BtcService, addresses: string[]): Promise<AddressesState> {
  const explorerURL = CHAINS[this.chainId].backends.explorerURL;
  // FIXME: use POST instead of GET and put addresses in the body
  const url = `/addresses/balances?addresses=${addresses.join(",")}`;

  const response = await fetch(explorerURL + url).then((response) => response.json());
  const result = addressBalancesDataSchema(addresses).safeParse(response);

  if (!result.success) {
    console.warn(`Invalid response from ${this.chainId} node endpoint: ${url.toString()}:`, result.error);
    throw new Error(`Error while fetching ${this.chainId} accounts infos from the node`);
  }

  const addressesData: Record<string, AddressesState["addresses"][string]> = {};
  for (const address of addresses) {
    const balance = result.data?.data[address] ? result.data.data[address] : 0n;
    addressesData[address] = {
      balances: {
        native: {
          available: balance,
          total: balance,
        },
      },
    };
  }
  return {
    chainId: this.chainId,
    addresses: addressesData,
  };
}

async function getAddressState(this: BtcService, address: string): Promise<AddressState> {
  if (z.string().regex(xpubRegex).safeParse(address).success) {
    throw new Error("Not implemented");
  }

  return this.getAddressesState([address]).then((addressesState): AddressState => {
    return {
      chainId: this.chainId,
      address: address,
      balances: addressesState.addresses[address].balances,
    };
  });
}

export { getAddressesState, getAddressState };
