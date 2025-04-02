import { CHAINS } from "~/app/config/chains";
import { AccountState, ChainId } from "~/app/model/types_WIP";
import { fetchAddressesDashboard, fetchXpubDashboard } from "../backend/blockchair";
import { fetchAddressBalance } from "../backend/mempoolSpace";
import { getCurrentBlockHeight, isValidXpub } from "../logic";
import { BitcoinService } from "../service";
import { BitcoinChainParams, Xpub } from "../types";

const createEmptyBalances = () => ({
  native: {
    available: 0n,
    total: 0n,
    unconfirmed: 0n,
  },
});

async function getAccountState(this: BitcoinService, accountId: string): Promise<AccountState> {
  return isValidXpub(this.chainId, accountId)
    ? getXpubState(this.chainId, accountId)
    : getAddressesState(this.chainId, [accountId]);
}

async function getAddressesState(chainId: ChainId, addresses: string[]): Promise<AccountState> {
  // For bitcoin-signet, use mempool.space API
  // FIXME Implementations for different providers should be handled
  // properly through provider abstraction, same as done in EVM & Tron family
  if (chainId === ChainId.BITCOIN_SIGNET) {
    // Since mempool.space only supports querying one address at a time,
    // we need to fetch each address balance separately
    const aggregatedBalances = createEmptyBalances();

    for (const address of addresses) {
      try {
        const addressBalance = await fetchAddressBalance(chainId, address);

        // Calculate confirmed balance (chain_stats)
        const confirmedBalance = BigInt(
          addressBalance.chain_stats.funded_txo_sum - addressBalance.chain_stats.spent_txo_sum
        );

        // Calculate unconfirmed/mempool balance
        const mempoolBalance = BigInt(
          addressBalance.mempool_stats.funded_txo_sum - addressBalance.mempool_stats.spent_txo_sum
        );

        // Add to aggregated balances
        aggregatedBalances.native.available += confirmedBalance + mempoolBalance;
        aggregatedBalances.native.total += confirmedBalance + mempoolBalance;
        aggregatedBalances.native.unconfirmed += mempoolBalance;
      } catch (error) {
        console.warn(`/!\\ Failed to fetch balance for bitcoin-signet address ${address}:`, error);
        // Continue with other addresses if one fails
      }
    }

    return {
      balances: aggregatedBalances,
    };
  }

  // For other Bitcoin chains, use the original implementation with blockchair
  const addressesResponse = await fetchAddressesDashboard(chainId, addresses);

  // Return zero balances if no data found
  if (!addressesResponse.data) {
    return {
      balances: createEmptyBalances(),
    };
  }

  const allUtxos = addressesResponse.data?.utxo;
  const currentBlockHeight = getCurrentBlockHeight(chainId, allUtxos, addressesResponse.context);
  const confirmations_required = (CHAINS[chainId].params as BitcoinChainParams).confirmations;
  const aggregatedBalances = createEmptyBalances();

  for (const address of addresses) {
    // Unconfirmed balance includes both:
    // - Mempool transactions (block_id = -1)
    // - Transactions in blocks but with insufficient confirmations
    const unconfirmedBalance = addressesResponse.data.utxo
      .filter((utxo) => utxo.address === address)
      .filter((utxo) => {
        // Pure mempool transactions should ALWAYS be counted as unconfirmed
        if (utxo.block_id === -1) return true;
        // For transactions in blocks, check if they have enough confirmations
        return currentBlockHeight - utxo.block_id + 1 < confirmations_required;
      })
      .reduce((total, utxo) => total + BigInt(utxo.value), 0n);

    const balance = BigInt(addressesResponse.data.addresses[address].balance);
    // available: includes ALL spendable amounts (both confirmed and unconfirmed)
    aggregatedBalances.native.available += balance;
    // total: same as available for Bitcoin (no locked amounts)
    aggregatedBalances.native.total += balance;
    // unconfirmed: track unconfirmed amount for information
    aggregatedBalances.native.unconfirmed += unconfirmedBalance;
  }

  return {
    balances: aggregatedBalances,
  };
}

async function getXpubState(chainId: ChainId, xpub: Xpub): Promise<AccountState> {
  const chainParams = CHAINS[chainId].params as BitcoinChainParams;

  // Get all UTXOs that are in blocks from xpub endpoint
  const { data, context } = await fetchXpubDashboard(chainId, xpub);

  const allUtxos = data.utxo;

  const currentBlockHeight = getCurrentBlockHeight(chainId, allUtxos, context);

  // Calculate confirmed balance for UTXOs with >= required confirmations
  // Confirmed tx are always visible in the xpub dashboard response
  const confirmedUtxos = allUtxos.filter((utxo) => {
    // Let's, exclude mempool transactions (which can SOMETIMES be visible in the xpub dashboard response)
    if (utxo.block_id === -1) return false;
    // Then check confirmations for transactions in blocks
    return currentBlockHeight - utxo.block_id + 1 >= chainParams.confirmations;
  });
  const confirmedUTXOsBalance = confirmedUtxos?.reduce((total, utxo) => total + BigInt(utxo.value), 0n) ?? 0n;

  // Calculate unconfirmed balance for UTXOs in blocks but < required confirmations
  // Because these transactions are included in a block, they are also visible in the xpub dashboard response
  const unconfirmedUtxos = allUtxos.filter(
    (utxo) => currentBlockHeight - utxo.block_id + 1 < chainParams.confirmations
  );
  const unconfirmedUtxosBalance =
    unconfirmedUtxos?.reduce((total, utxo) => total + BigInt(utxo.value), 0n) ?? 0n;

  // Get mempool transactions
  // Mempool transactions are SOMETIMES visible in the xpub dashboard response (but not always)
  const mempoolUtxos = allUtxos.filter((utxo) => utxo.block_id === -1);
  const mempoolUtxosBalance = mempoolUtxos?.reduce((total, utxo) => total + BigInt(utxo.value), 0n) ?? 0n;

  return {
    balances: {
      native: {
        available: confirmedUTXOsBalance + unconfirmedUtxosBalance + mempoolUtxosBalance,
        total: confirmedUTXOsBalance + unconfirmedUtxosBalance + mempoolUtxosBalance,
        unconfirmed: unconfirmedUtxosBalance + mempoolUtxosBalance,
      },
    },
  };
}

export { getAccountState };
