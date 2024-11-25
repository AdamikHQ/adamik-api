import { CHAINS } from "~/app/config/chains";
import { AccountState, ChainId } from "~/app/model/types_WIP";
import { fetchAddressesDashboard, fetchXpubDashboard } from "../backend/explorer";
import { isValidXpub } from "../logic";
import { BitcoinService } from "../service";
import { BitcoinChainParams, Xpub } from "../types";

async function getAccountState(this: BitcoinService, accountId: string): Promise<AccountState> {
  return isValidXpub(this.chainId, accountId)
    ? getXpubState(this.chainId, accountId)
    : getAddressesState(this.chainId, [accountId]);
}

async function getAddressesState(chainId: ChainId, addresses: string[]): Promise<AccountState> {
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
      // Unconfirmed balance includes both:
      // - Mempool transactions (block_id = -1)
      // - Transactions in blocks but with insufficient confirmations
      const unconfirmedBalance = addressesResult.data.utxo
        .filter((utxo) => utxo.address === address)
        .filter((utxo) => {
          // Pure mempool transactions should ALWAYS be counted as unconfirmed
          if (utxo.block_id === -1) return true;
          // For transactions in blocks, check if they have enough confirmations
          return currentBlockHeight - utxo.block_id + 1 < confirmations_required;
        })
        .reduce((total, utxo) => total + BigInt(utxo.value), 0n);

      const balance = BigInt(addressesResult.data.addresses[address].balance);
      // available: includes ALL spendable amounts (both confirmed and unconfirmed)
      aggregatedBalances.native.available += balance;
      // total: same as available for Bitcoin (no locked amounts)
      aggregatedBalances.native.total += balance;
      // unconfirmed: track unconfirmed amount for information
      aggregatedBalances.native.unconfirmed += unconfirmedBalance;
    }
  }

  return {
    chainId,
    accountId: addresses.join(","),
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
    .filter((utxo) => {
      // Pure mempool transactions should ALWAYS be counted as unconfirmed
      if (utxo.block_id === -1) return true;
      // For transactions in blocks, check if they have enough confirmations
      return currentBlockHeight - utxo.block_id + 1 < confirmations_required;
    })
    .reduce((total, utxo) => total + BigInt(utxo.value), 0n);

  return {
    chainId: chainId,
    balances: {
      native: {
        available: xpubResponse.data[xpub].xpub.balance,
        total: xpubResponse.data[xpub].xpub.balance,
        unconfirmed: unconfirmedBalance,
      },
    },
    accountId: xpub,
  };
}

export { getAccountState };
