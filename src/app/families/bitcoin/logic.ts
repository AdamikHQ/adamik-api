import ecc from "@bitcoinerlab/secp256k1";
import { address as addressSerde, initEccLib, networks, Transaction } from "bitcoinjs-lib";
import { add, differenceInCalendarDays, differenceInWeeks, formatDistanceStrict } from "date-fns";
import { ChainId } from "~/app/model/types_WIP";
import { ThirdPartyProviderError } from "~/app/tools/handlers/errors";
import { BlockchairResponseContext } from "./backend/types";
import { Xpub } from "./types";

// Allows support for Taproot addresses validation: https://github.com/bitcoinjs/bitcoinjs-lib/issues/1919
initEccLib(ecc);

const xpubRegex =
  /^([xyYzZtuUvV]pub[1-9A-HJ-NP-Za-km-z]{79,108})(?:(?:$|\?)((?!.*&c=)c=\d{10}|(?!.*&h=)h=bip\d{2,3})(?:(?=(?:&c=|&h=))&(c=\d{10}|h=bip\d{2,3}))?)?$/;

// FIXME: we'll want to validate also the xpub prefix with chainId (make sure that lpub are not used for BTC for example)
function isValidXpub(_chainId: ChainId, str: string): str is Xpub {
  return xpubRegex.test(str);
}

// Looks like a hack but it's actually the best way to check if the address is valid
// https://github.com/andcoisqu/bitcoinjs-lib/blob/d4b57292995f9233fc0b4ed9e4dfda3be85d3e19/test/integration/addresses.js#L100
function isValidAddress(chainId: ChainId, address: string): boolean {
  const network = getNetworkForChainId(chainId);
  try {
    // this will throw an error if the address is invalid
    addressSerde.toOutputScript(address, network);
    return true;
  } catch (error) {
    return false;
  }
}

function getNetworkForChainId(chainId: ChainId): networks.Network {
  switch (chainId) {
    case ChainId.BITCOIN:
      return networks.bitcoin;
    case ChainId.BITCOIN_TESTNET:
    case ChainId.BITCOIN_SIGNET:
      return networks.testnet;
    case ChainId.LITECOIN:
      // from https://github.com/bitcoinjs/bitcoinjs-lib/blob/34e1644b5fb60055793ec3078f2e4f48b2648ca6/test/address.spec.ts#L14
      return {
        messagePrefix: "\x19Litecoin Signed Message:\n",
        bech32: "ltc",
        bip32: {
          public: 0x019da462,
          private: 0x019d9cfe,
        },
        pubKeyHash: 0x30,
        scriptHash: 0x32,
        wif: 0xb0,
      };
    case ChainId.DOGECOIN:
      // from https://github.com/bitcoinjs/bitcoinjs-lib/blob/4faa0ce679d67b69f0165b73532b34a19757693f/src/networks.js#L38-L48
      return {
        messagePrefix: "\x19Dogecoin Signed Message:\n",
        bech32: "doge", // WARNING: bech32 is not used, it's just to satisfy the interface
        bip32: {
          public: 0x02facafd,
          private: 0x02fac398,
        },
        pubKeyHash: 0x1e,
        scriptHash: 0x16,
        wif: 0x9e,
      };
    default:
      throw new Error("Not implemented");
  }
}

/**
 * Get current block height from API response context (instead of using fetchStats for fresh blockchain data)
 *
 * Note: For mempool-only transactions (block_id = -1), the API doesn't return block height
 * In this case, we return MAX_SAFE_INTEGER to ensure these are counted as unconfirmed
 */
// FIXME Function's signature and purpose are neither natural nor clear, should be refacto and/or removed
function getCurrentBlockHeight(
  chainId: ChainId,
  utxoData: { block_id: number }[],
  responseContext: BlockchairResponseContext
): number {
  const hasNonMempoolTx = utxoData?.some((utxo) => utxo.block_id !== -1);

  // For mempool-only transactions, return MAX_SAFE_INTEGER
  if (!hasNonMempoolTx) {
    return Number.MAX_SAFE_INTEGER;
  }

  // For transactions in blocks, we need the block height
  if (!responseContext.state) {
    console.warn(
      `Missing current block height for chain ID ${chainId} in: ${JSON.stringify(responseContext)}`
    );
    throw new ThirdPartyProviderError(`Missing current block height in data returned from explorer`);
  }

  return responseContext.state;
}

/**
 * Determines if a script is a witness program (P2WPKH, P2WSH, or P2TR)
 * @param scriptHex - The script in hex format
 * @returns boolean indicating if the script is a witness program
 */
function isWitnessScript(scriptHex: string): boolean {
  const script = Buffer.from(scriptHex, "hex");

  // Witness program: version 0 (P2WPKH/P2WSH) or version 1 (P2TR)
  // Format: OP_n (version) followed by a push of 20 or 32 bytes

  if (script.length === 22 && script[0] === 0x00 && script[1] === 0x14) {
    return true; // P2WPKH
  }

  if (script.length === 34 && script[0] === 0x00 && script[1] === 0x20) {
    return true; // P2WSH
  }

  if (script.length === 34 && script[0] === 0x51 && script[1] === 0x20) {
    return true; // P2TR (Taproot)
  }

  return false;
}

/**
 * Detects if a script is a Pay-to-Script-Hash (P2SH) type
 * @param scriptHex - The script in hex format
 * @returns boolean indicating if the script is P2SH
 */
function isP2SHScript(scriptHex: string): boolean {
  const script = Buffer.from(scriptHex, "hex");
  return script.length === 23 && script[0] === 0xa9 && script[1] === 0x14 && script[22] === 0x87;
}

function isTaprootAddress(address: string, network: networks.Network = networks.bitcoin): boolean {
  // Only Bitcoin supports taproot at the moment
  if (network !== networks.bitcoin && network !== networks.testnet) {
    return false;
  }

  try {
    const decoded = addressSerde.fromBech32(address);
    // Taproot addresses use Bech32m (version 1) and have specific network prefixes
    return decoded.version === 1 && decoded.prefix === (network === networks.testnet ? "tb" : "bc");
  } catch (error) {
    return false;
  }
}

/**
 * Clears the signatures from a transaction.
 * @param tx - The transaction to clear the signatures from.
 * @returns The transaction with the signatures cleared.
 */
export const clearTxSignatures = (tx: Transaction): Transaction => {
  tx.ins.forEach((input) => {
    input.script = Buffer.alloc(0);
    input.witness = [];
  });
  return tx;
};

const BLOCKS_PER_HOUR = 6;
const WEEKS_PRECISION = 5;
const DAY_TO_WEEK_DISPLAY_THRESHOLD = 30;

/**
 * Converts a number of blocks  of the babylon chain into days or weeks
 * Returns the time in days if the difference is less than 7 days
 * Otherwise, returns the time in weeks
 *
 * @param {number | undefined} blocks - The number of blocks to convert.
 * @returns {string} - The converted time in days or weeks.
 * Rounded to 5 weeks if the difference is greater than 7 days.
 *
 * Examples of usage:
 * blocksToDisplayTime(30000); // "29 weeks"
 * blocksToDisplayTime(1); // "1 day"
 * blocksToDisplayTime(200); // "2 days"
 */
// (copied from https://github.com/babylonlabs-io/simple-staking/blob/db23721053b48641294f20e49930899c87cdcd7b/src/utils/time.ts#L28)
// TODO Adapt to return a raw timestamp instead of display-formatted strings
// TODO Move this into a babylon-specific file
function babylonBlocksToDisplayTime(blocks: number | undefined): string {
  // If no blocks are provided, return default value
  if (!blocks) return "-";

  // Calculate the equivalent time in hours
  const hours = blocks / BLOCKS_PER_HOUR;

  // Calculate the start and end dates
  // get the timestamp now
  const startDate = new Date();
  const endDate = add(startDate, { hours });

  const dayDifference = differenceInCalendarDays(endDate, startDate);
  // If the difference is greater than or equal to 30 days, return the difference in weeks
  if (dayDifference >= DAY_TO_WEEK_DISPLAY_THRESHOLD) {
    // Calculate the difference in weeks
    const weeks = differenceInWeeks(endDate, startDate, {
      roundingMethod: "ceil",
    });
    const roundedWeeks = Math.round(weeks / WEEKS_PRECISION) * WEEKS_PRECISION;
    return `${roundedWeeks} weeks`;
  }

  // Otherwise, return the difference in days and round up to the nearest day
  return formatDistanceStrict(startDate, endDate, {
    unit: "day",
    roundingMethod: "ceil",
  });
}

export {
  babylonBlocksToDisplayTime,
  getCurrentBlockHeight,
  getNetworkForChainId,
  isP2SHScript,
  isTaprootAddress,
  isValidAddress,
  isValidXpub,
  isWitnessScript,
};
