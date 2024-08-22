import { CHAINS } from "~/app/config/chains";
import { AccountState } from "~/app/model/types_WIP";
import { BtcService } from ".";
import { fetchAddressesDashboard, fetchXpubDashboard } from "../backend/explorer";
import { isValidXpub } from "../logic";
import { BtcParams, Xpub } from "../types";

async function getAddressesState(this: BtcService, addresses: string[]): Promise<AccountState> {
  const addressesResult = await fetchAddressesDashboard(this.chainId, addresses);

  const confirmations_required = (CHAINS[this.chainId].params as BtcParams).confirmations;
  const aggregatedBalances = {
    native: {
      available: 0n,
      total: 0n,
      unconfirmed: 0n,
    },
  };

  if (addressesResult.data) {
    if (!addressesResult.context.state) {
      console.warn(`getAddressesState - missing current block height: ${JSON.stringify(addressesResult)}`);
      throw new Error(`fetchNetworkInformations - provider error: missing current block height`);
    }
    const currentBlockHeight = addressesResult.context.state;

    for (const address of addresses) {
      // extract unconfirmed balance from UTXOs
      const unconfirmedBalance = addressesResult.data.utxo
        .filter((utxo) => utxo.address === address)
        .filter((utxo) => currentBlockHeight - utxo.block_id + 1 < confirmations_required)
        .reduce((total, utxo) => total + BigInt(utxo.value), 0n);

      const balance = BigInt(addressesResult.data.addresses[address].balance);
      aggregatedBalances.native.available += balance - unconfirmedBalance;
      aggregatedBalances.native.total += balance;
      aggregatedBalances.native.unconfirmed += unconfirmedBalance;
    }
  }

  return {
    chainId: this.chainId,
    accountId: addresses.join(","),
    balances: aggregatedBalances,
  };
}

async function getAddressState(this: BtcService, addressOrXpub: string): Promise<AccountState> {
  return isValidXpub(addressOrXpub)
    ? this.getXpubState(addressOrXpub)
    : this.getAddressesState([addressOrXpub]);
}

async function getXpubState(this: BtcService, xpub: Xpub): Promise<AccountState> {
  const xpubResponse = await fetchXpubDashboard(this.chainId, xpub);

  if (!xpubResponse.context.state) {
    console.warn(`getAddressesState - missing current block height: ${JSON.stringify(xpubResponse)}`);
    throw new Error(`fetchNetworkInformations - provider error: missing current block height`);
  }
  const currentBlockHeight = xpubResponse.context.state;

  // extract unconfirmed balance from UTXOs
  const confirmations_required = (CHAINS[this.chainId].params as BtcParams).confirmations;
  const unconfirmedBalance = xpubResponse.data[xpub].utxo
    .filter((utxo) => currentBlockHeight - utxo.block_id + 1 < confirmations_required)
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
    accountId: xpub,
  };
}

export { getAddressesState, getAddressState, getXpubState };
