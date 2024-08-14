import { CHAINS } from "~/app/config/chains";
import { AddressState, AddressesState } from "~/app/model/types_WIP";
import { BtcService } from ".";
import { fetchAddressesDashboard, fetchXpubDashboard } from "../backend/explorer";
import { isValidXpub } from "../logic";
import { BtcParams, Xpub } from "../types";

async function getAddressesState(this: BtcService, addresses: string[]): Promise<AddressesState> {
  const addressesResult = await fetchAddressesDashboard(this.chainId, addresses);

  const confirmations_required = (CHAINS[this.chainId].params as BtcParams).confirmations;
  const addressesData: Record<string, AddressesState["addresses"][string]> = {};

  for (const address of addresses) {
    // extract unconfirmed balance from UTXOs
    const unconfirmedBalance = addressesResult.data.utxo
      .filter((utxo) => utxo.address === address)
      .filter((utxo) => addressesResult.context.state - utxo.block_id + 1 < confirmations_required)
      .reduce((total, utxo) => total + BigInt(utxo.value), 0n);

    const balance = BigInt(addressesResult.data.addresses[address].balance);
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
  return isValidXpub(addressOrXpub)
    ? this.getXpubState(addressOrXpub)
    : this.getAddressesState([addressOrXpub]).then((addressesState): AddressState => {
        return {
          chainId: this.chainId,
          address: addressOrXpub,
          balances: addressesState.addresses[addressOrXpub].balances,
        };
      });
}

async function getXpubState(this: BtcService, xpub: Xpub): Promise<AddressState> {
  const xpubResponse = await fetchXpubDashboard(this.chainId, xpub);

  // extract unconfirmed balance from UTXOs
  const confirmations_required = (CHAINS[this.chainId].params as BtcParams).confirmations;
  const unconfirmedBalance = xpubResponse.data[xpub].utxo
    .filter((utxo) => xpubResponse.context.state - utxo.block_id + 1 < confirmations_required)
    .reduce((total, utxo) => total + BigInt(utxo.value), 0n);

  return {
    chainId: this.chainId,
    balances: {
      native: {
        available: xpubResponse.data[xpub].xpub.balance - unconfirmedBalance,
        total: xpubResponse.data[xpub].xpub.balance,
        unconfirmed: unconfirmedBalance,
      },
    },
    address: xpub,
  };
}

export { getAddressState, getAddressesState, getXpubState };
