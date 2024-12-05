import { CHAINS } from "~/app/config/chains";
import { AccountState, ChainId } from "~/app/model/types_WIP";
import { fetchAddressesDashboard, fetchXpubDashboard, getCurrentBlockHeight } from "../backend/explorer";
import { isValidXpub } from "../logic";
import { BitcoinService } from "../service";
import { BitcoinChainParams, Xpub } from "../types";

const createEmptyBalances = () => ({
  native: {
    available: 0n,
    total: 0n,
    unconfirmed: 0n,
  },
});

/**
 * Gets account state for either an xpub or individual address
 *
 * Note: The implementation differs between xpub and address:
 * - For addresses: mempool transactions are ALWAYS included in the response
 * - For xpubs: mempool transactions are SOMETIMES included in the response, but may be temporarily dropped by the explorer
 *
 * As a result, the unconfirmed balance reported for xpubs may be lower than the actual unconfirmed balance reported for addresses
 * FIXME: This is a bug, and we should fix it by ensuring that mempool transactions are always included in the response for xpubs
 * Currently being discussed with the Blockchain explorer team
 */

async function getAccountState(this: BitcoinService, accountId: string): Promise<AccountState> {
  return isValidXpub(this.chainId, accountId)
    ? getXpubState(this.chainId, accountId)
    : getAddressesState(this.chainId, [accountId]);
}

async function getAddressesState(chainId: ChainId, addresses: string[]): Promise<AccountState> {
  const addressesResult = await fetchAddressesDashboard(chainId, addresses);

  // Return zero balances if no data found
  if (!addressesResult.data) {
    return {
      chainId,
      accountId: addresses.join(","),
      balances: createEmptyBalances(),
    };
  }

  const currentBlockHeight = await getCurrentBlockHeight(chainId, addressesResult);
  const confirmations_required = (CHAINS[chainId].params as BitcoinChainParams).confirmations;
  const aggregatedBalances = createEmptyBalances();

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

  return {
    chainId,
    accountId: addresses.join(","),
    balances: aggregatedBalances,
  };
}

async function getXpubState(chainId: ChainId, xpub: Xpub): Promise<AccountState> {
  // 1. Get all UTXOs that are in blocks from xpub endpoint
  const xpubResponse = await fetchXpubDashboard(chainId, xpub);
  const currentBlockHeight = await getCurrentBlockHeight(chainId, xpubResponse);
  const confirmations_required = (CHAINS[chainId].params as BitcoinChainParams).confirmations;

  // Calculate confirmed balance for UTXOs with >= required confirmations
  // Confirmed tx are always visible in the xpub dashboard response
  const confirmedUtxos = xpubResponse.data?.[xpub]?.utxo.filter((utxo) => {
    // Let's, exclude mempool transactions (which can SOMETIMES be visible in the xpub dashboard response)
    if (utxo.block_id === -1) return false;
    // Then check confirmations for transactions in blocks
    return currentBlockHeight - utxo.block_id + 1 >= confirmations_required;
  });
  const confirmedUTXOsBalance = confirmedUtxos?.reduce((total, utxo) => total + BigInt(utxo.value), 0n) ?? 0n;

  // Calculate unconfirmed balance for UTXOs in blocks but < required confirmations
  // Because these transactions are included in a block, they are also visible in the xpub dashboard response
  const unconfirmedUtxos = xpubResponse.data?.[xpub]?.utxo.filter(
    (utxo) => currentBlockHeight - utxo.block_id + 1 < confirmations_required
  );
  const unconfirmedUtxosBalance =
    unconfirmedUtxos?.reduce((total, utxo) => total + BigInt(utxo.value), 0n) ?? 0n;

  // Get mempool transactions
  // Mempool transactions are SOMETIMES visible in the xpub dashboard response (but not always)
  const mempoolUtxos = xpubResponse.data?.[xpub]?.utxo.filter((utxo) => utxo.block_id === -1);
  const mempoolUtxosBalance = mempoolUtxos?.reduce((total, utxo) => total + BigInt(utxo.value), 0n) ?? 0n;

  return {
    chainId: chainId,
    balances: {
      native: {
        available: confirmedUTXOsBalance + unconfirmedUtxosBalance + mempoolUtxosBalance,
        total: confirmedUTXOsBalance + unconfirmedUtxosBalance + mempoolUtxosBalance,
        unconfirmed: unconfirmedUtxosBalance + mempoolUtxosBalance,
      },
    },
    accountId: xpub,
  };
}

export { getAccountState };
