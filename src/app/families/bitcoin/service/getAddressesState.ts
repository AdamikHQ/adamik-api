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
    console.info(`getAddressState - received invalid response ${JSON.stringify(response)}\n\tbackend parsing error: ${result.error}`);
  }

  const addressesData: Record<string, AddressesState["addresses"][string]> = {};
  for (const address of addresses) {
    addressesData[address] = {
      balances: {
        native: {
          available: result.data?.data[address] ? result.data.data[address] : 0n,
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
