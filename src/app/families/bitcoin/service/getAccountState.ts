import { CHAINS } from "~/app/config/chains";
import { AccountState, AddressesAggregatedState, ChainId } from "~/app/model/types_WIP";
import { BtcService } from ".";
import { fetchAddressesDashboard, fetchXpubDashboard } from "../backend/explorer";
import { isValidXpub } from "../logic";
import { BitcoinChainParams, Xpub } from "../types";

async function getAccountState(
  this: BtcService,
  account: { addresses: string[] } | { accountId: string }
): Promise<AccountState | AddressesAggregatedState> {
  return "addresses" in account
    ? getAddressesState(this.chainId, account.addresses)
    : isValidXpub(this.chainId, account.accountId)
    ? getXpubState(this.chainId, account.accountId)
    : getAddressesState(this.chainId, [account.accountId]);
}

async function getAddressesState(chainId: ChainId, addresses: string[]): Promise<AddressesAggregatedState> {
  const addressesResult = await fetchAddressesDashboard(chainId, addresses);

  const confirmations_required = (CHAINS[chainId].params as BitcoinChainParams).confirmations;
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
    chainId,
    addresses,
    balances: aggregatedBalances,
  };
}

async function getXpubState(chainId: ChainId, xpub: Xpub): Promise<AccountState> {
  const xpubResponse = await fetchXpubDashboard(chainId, xpub);

  if (!xpubResponse.context.state) {
    console.warn(`/!\\ getAddressesState - missing current block height: ${JSON.stringify(xpubResponse)}`);
    throw new Error(`fetchNetworkInformations - provider error: missing current block height`);
  }
  const currentBlockHeight = xpubResponse.context.state;

  // extract unconfirmed balance from UTXOs
  const confirmations_required = (CHAINS[chainId].params as BitcoinChainParams).confirmations;
  const unconfirmedBalance = xpubResponse.data[xpub].utxo
    .filter((utxo) => currentBlockHeight - utxo.block_id + 1 < confirmations_required)
    .reduce((total, utxo) => total + BigInt(utxo.value), 0n);

  return {
    chainId: chainId,
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

export { getAccountState };
