import { AddressesState } from "~/app/model/types_WIP";
import { BtcService } from ".";
import { CHAINS } from "~/app/config/chains";
import { addressBalancesDataSchema } from "../backend/types";

async function getAddressesState(this: BtcService, addresses: string[]): Promise<AddressesState> {
  const explorerURL = CHAINS[this.chainId].backends.explorerURL;
  // FIXME: use POST instead of GET and put addresses in the body
  const url = `/addresses/balances?addresses=${addresses.join(",")}`;

  const response = await fetch(explorerURL + url).then((response) => response.json());
  const result = addressBalancesDataSchema(addresses).safeParse(response);

  if (!result.success) {
    // FIXME: discuss standard way to handle errors within backends (tell the user or not? give default empty values or not?)
    throw new Error(`getAddressState - received invalid response ${JSON.stringify(response)}\n\tbackend parsing error: ${result.error}`);
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

export { getAddressesState };
