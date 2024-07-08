import { BLOCKCHAIR_API_KEY } from "~/app/config/apiKeys";
import { CHAINS } from "~/app/config/chains";
import { AddressState, AddressesState } from "~/app/model/types_WIP";
import { BtcService } from ".";
import { AddressesDashboardResponse, XpubDashboardResponse } from "../backend/types";
import { Xpub, isXpub } from "../logic";
import { BtcParams } from "../types";

async function getAddressesState(this: BtcService, addresses: string[]): Promise<AddressesState> {
  const explorerURL = CHAINS[this.chainId].backends.explorerURL;
  const queryParams = new URLSearchParams({
    key: BLOCKCHAIR_API_KEY,
  });
  // FIXME: use POST instead of GET and put addresses in the body
  const url = `/dashboards/addresses/${addresses.join(",")}?${queryParams.toString()}`;

  const response = await fetch(explorerURL + url).then((res) => res.json());
  const result = AddressesDashboardResponse.safeParse(response);

  if (!result.success) {
    // FIXME: discuss standard way to handle errors within backends (tell the user or not? give default empty values or not?)
    throw new Error(`getAddressState - received invalid response ${JSON.stringify(response)}\n\tbackend parsing error: ${result.error}`);
  }

  const confirmations_required = (CHAINS[this.chainId].params as BtcParams).confirmations;
  const addressesData: Record<string, AddressesState["addresses"][string]> = {};

  for (const address of addresses) {
    // extract unconfirmed balance from UTXOs
    const unconfirmedBalance = result.data.data.utxo
      .filter((utxo) => utxo.address === address)
      .filter((utxo) => (result.data.context.state - utxo.block_id + 1) < confirmations_required)
      .reduce((total, utxo) => total + (BigInt(utxo.value)), 0n);

    const balance = BigInt(result.data?.data.addresses[address].balance);
    addressesData[address] = {
      balances: {
        native: {
          available: balance - unconfirmedBalance,
          total: balance,
          unconfirmed: unconfirmedBalance,
        },
      },
    };
  }
  return {
    chainId: this.chainId,
    addresses: addressesData,
  };
}

async function getAddressState(this: BtcService, addressOrXpub: string): Promise<AddressState> {
  if (isXpub(addressOrXpub)) {
    return this.getXpubState(addressOrXpub);
  }

  return this.getAddressesState([addressOrXpub]).then((addressesState): AddressState => {
    return {
      chainId: this.chainId,
      address: addressOrXpub,
      balances: addressesState.addresses[addressOrXpub].balances,
    }
  });
}

async function getXpubState(this: BtcService, xpub: Xpub): Promise<AddressState> {
  const explorerURL = CHAINS[this.chainId].backends.explorerURL;
  const queryParams = new URLSearchParams({
    key: BLOCKCHAIR_API_KEY,
  });

  const url = `/dashboards/xpub/${xpub}?${queryParams.toString()}`;
  const response = await fetch(explorerURL + url).then((response) => response.json());
  const result = XpubDashboardResponse.safeParse(response);

  if (!result.success) {
    // FIXME: discuss standard way to handle errors within backends (tell the user or not? give default empty values or not?)
    throw new Error(`getXpubState - received invalid response ${JSON.stringify(response)}\n\tbackend parsing error: ${result.error}`);
  }

  // extract unconfirmed balance from UTXOs
  const confirmations_required = (CHAINS[this.chainId].params as BtcParams).confirmations;
  const unconfirmedBalance = result.data.data[xpub].utxo
    .filter((utxo) => (result.data.context.state - utxo.block_id + 1) < confirmations_required)
    .reduce((total, utxo) => total + (BigInt(utxo.value)), 0n);

  return {
    chainId: this.chainId,
    balances: {
      native: {
        available: result.data.data[xpub].xpub.balance - unconfirmedBalance,
        total: result.data.data[xpub].xpub.balance,
        unconfirmed: unconfirmedBalance,
      },
    },
    address: xpub,
  }
}

export { getAddressState, getAddressesState, getXpubState };
