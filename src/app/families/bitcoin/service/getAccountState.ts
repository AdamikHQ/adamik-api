import { CHAINS } from "~/app/config/chains";
import { AccountState, ChainId } from "~/app/model/types_WIP";
import { fetchAddressesDashboard, fetchXpubDashboard, getCurrentBlockHeight } from "../backend/explorer";
import { isValidXpub } from "../logic";
import { BitcoinService } from "../service";
import { BitcoinChainParams, Xpub } from "../types";

/**
 * Gets account state for either an xpub or individual address
 *
 * Note: The implementation differs between xpub and address:
 * - For addresses: mempool transactions are directly included in the response
 * - For xpubs: requires additional address lookup to detect mempool transactions
 *
 * This ensures consistent unconfirmed balance reporting regardless of account type.
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
      balances: {
        native: {
          available: 0n,
          total: 0n,
          unconfirmed: 0n,
        },
      },
    };
  }

  const currentBlockHeight = await getCurrentBlockHeight(chainId, addressesResult);
  const confirmations_required = (CHAINS[chainId].params as BitcoinChainParams).confirmations;
  const aggregatedBalances = {
    native: {
      available: 0n,
      total: 0n,
      unconfirmed: 0n,
    },
  };

  if (addressesResult.data) {
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
  // 1. Get all UTXOs that are in blocks from xpub endpoint
  const xpubResponse = await fetchXpubDashboard(chainId, xpub);

  const currentBlockHeight = await getCurrentBlockHeight(chainId, xpubResponse);
  const confirmations_required = (CHAINS[chainId].params as BitcoinChainParams).confirmations;
  // Calculate unconfirmed balance for UTXOs in blocks but < required confirmations
  const unconfirmedFromBlocks =
    xpubResponse.data?.[xpub]?.utxo
      .filter((utxo) => currentBlockHeight - utxo.block_id + 1 < confirmations_required)
      .reduce((total, utxo) => total + BigInt(utxo.value), 0n) ?? 0n;

  // 2. Get list of all checked addresses
  const checkedAddresses = xpubResponse.context.checked.map((item) => item.split(": ")[1]);

  // 3. Fetch addresses data to check for mempool transactions
  const addressesResponse = await fetchAddressesDashboard(chainId, checkedAddresses);

  // 4. Calculate unconfirmed balance from mempool transactions only
  const mempoolBalance =
    addressesResponse.data?.utxo
      .filter((utxo) => utxo.block_id === -1) // Only pure mempool transactions
      .reduce((total, utxo) => total + BigInt(utxo.value), 0n) ?? 0n;

  // 5. Combine: unconfirmed = (UTXOs in blocks but unconfirmed) + (mempool UTXOs)
  return {
    chainId: chainId,
    balances: {
      native: {
        available: xpubResponse.data?.[xpub]?.xpub.balance ?? 0n,
        total: xpubResponse.data?.[xpub]?.xpub.balance ?? 0n,
        unconfirmed: unconfirmedFromBlocks + mempoolBalance,
      },
    },
    accountId: xpub,
  };
}

export { getAccountState };
