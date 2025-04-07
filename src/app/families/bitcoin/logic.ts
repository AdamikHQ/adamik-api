import ecc from "@bitcoinerlab/secp256k1";
import { address as addressSerde, initEccLib, networks, Psbt } from "bitcoinjs-lib";
import coinSelect from "coinselect";
import split from "coinselect/split.js";
import { CHAINS } from "~/app/config/chains";
import { ChainId, Status, TransactionData } from "~/app/model/types_WIP";
import { statusFromMessage } from "~/app/tools/handlers/apiHandler";
import {
  AdamikApiServerError,
  InvalidTransactionError,
  ThirdPartyProviderError,
} from "~/app/tools/handlers/errors";
import {
  fetchAddressesDashboard,
  fetchFeePerByte as fetchFeePerByteBlockchair,
  fetchRawTransaction,
  fetchXpubDashboard,
} from "./backend/blockchair";
import { BlockchairRawTransactionData, BlockchairResponseContext } from "./backend/types";
import {
  BitcoinChainParams,
  PsbtInputExtended,
  PsbtOutputExtended,
  PsbtWithFee,
  UtxoWithMetadata,
  Xpub,
} from "./types";

// Allows support for Taproot addresses validation: https://github.com/bitcoinjs/bitcoinjs-lib/issues/1919
initEccLib(ecc);

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

// Detects if a script is a Pay-to-Script-Hash (P2SH) type
function isP2SHScript(scriptHex: string): boolean {
  const script = Buffer.from(scriptHex, "hex");
  return script.length === 23 && script[0] === 0xa9 && script[1] === 0x14 && script[22] === 0x87;
}

// Determines if a script is a witness program (P2WPKH, P2WSH, or P2TR)
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

function isValidTransactionHash(transactionHash: string): boolean {
  // Check if the string is exactly 64 characters long
  if (transactionHash.length !== 64) {
    return false;
  }

  // Check if the string contains only valid hexadecimal characters
  const hexRegex = /^[0-9a-f]{64}$/;
  return hexRegex.test(transactionHash);
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

// Transfer PSBT is built manually, only using the bitcoin-js lib
// TODO Refacto to support mempool.space too, with providers abstraction
async function buildTransferPsbt(
  chainId: ChainId,
  transactionData: TransactionData,
  status: Status
): Promise<PsbtWithFee> {
  const chainParams = CHAINS[chainId].params as BitcoinChainParams;

  const psbt = new Psbt({ network: getNetworkForChainId(chainId) });

  const { data, context } = isValidXpub(chainId, transactionData.senderAddress)
    ? await fetchXpubDashboard(chainId, transactionData.senderAddress)
    : await fetchAddressesDashboard(chainId, [transactionData.senderAddress]);

  const feePerByte = await fetchFeePerByteBlockchair(chainId);

  const allUtxos: UtxoWithMetadata[] = data?.utxo || [];

  // Select UTXOs using either:
  // - coinSelect: finds optimal UTXOs for exact amount
  // - split: uses all UTXOs to send maximum amount
  // TODO Test to determine whether or not support of the staking "withdraw" transaction is required:
  // 1) Create then expire a staking position
  // 2) Create a regular transfer tx with useMaxAmount = true
  // 3) Check here whether the selection algorithm uses the staking outputs or not
  // 4) Repeat 2 & 3 but with a manual amount that equals the total spendable balance
  // --> If all utxos are picked, then the withdraw transaction isn't required,
  //  as it means the utxo selection algos are able to use the staking outputs
  const selectionAlgorithm = transactionData.useMaxAmount ? split : coinSelect;
  const { inputs, outputs, fee } = selectionAlgorithm(
    allUtxos,
    [
      {
        address: transactionData.recipientAddress,
        value: transactionData.amount ? Number(transactionData.amount) : undefined,
      },
    ],
    feePerByte
  );

  // inputs and outputs will be undefined if no solution was found
  if (!inputs || !outputs) {
    console.warn(
      "No solution found during UTXO selection for transaction data:",
      JSON.stringify(transactionData)
    );
    throw new InvalidTransactionError(
      statusFromMessage(
        "No solution found during UTXO selection, you might not have enough funds or an account that's too fragmented"
      )
    );
  }

  // HANDLE INPUTS

  // NOTE The published 'UTXO' type from coinselect is WRONG!
  // The runtime data actually matches the UtxoWithMetadata type
  const psbtInputs = inputs as UtxoWithMetadata[];
  const currentBlockHeight = getCurrentBlockHeight(chainId, allUtxos, context);

  const rawTransactions = new Map<string, BlockchairRawTransactionData>(); // tx hash and raw tx string

  // Enrich selected inputs with data from the explorer
  // Note: This supports both confirmed and unconfirmed (mempool) inputs
  for (const [inputIndex, input] of psbtInputs.entries()) {
    // Should not happen, just to satisfy TS
    if (!input.script_hex) {
      throw new Error("Missing script_hex in input");
    }

    // FIXME This validation should happen in validateTransaction,
    // but no easy way to retrieve the inputs there...
    // UTXO is in mempool (block_id = -1)
    if (input.block_id === -1) {
      status.warnings.push({
        message: `Using unconfirmed input from transaction ${input.transaction_hash} (still pending in mempool)`,
      });
    }
    // UTXO is in a block but has < 6 confirmations
    else if (input.block_id > 0) {
      const confirmations_required = chainParams.confirmations;
      const confirmations = currentBlockHeight - input.block_id + 1;
      if (confirmations < confirmations_required) {
        status.warnings.push({
          message: `Using input from transaction ${
            input.transaction_hash
          } with only ${confirmations} confirmation${confirmations === 1 ? "" : "s"}`,
        });
      }
    }

    if (isWitnessScript(input.script_hex)) {
      psbt.addInput({
        hash: input.transaction_hash,
        index: input.index,
        witnessUtxo: {
          script: Buffer.from(input.script_hex, "hex"),
          value: input.value,
        },
      });
    } else {
      if (!rawTransactions.has(input.transaction_hash)) {
        const rawTransaction = await fetchRawTransaction(chainId, input.transaction_hash);
        rawTransactions.set(input.transaction_hash, rawTransaction);
      }

      const rawTransaction = rawTransactions.get(input.transaction_hash)!;
      const inputData: PsbtInputExtended = {
        hash: input.transaction_hash,
        index: input.index,
        nonWitnessUtxo: Buffer.from(rawTransaction.raw_transaction, "hex"),
      };

      if (isP2SHScript(input.script_hex)) {
        const decodedTx = rawTransaction.decoded_raw_transaction;
        const scriptSigHex = decodedTx?.vin?.[input.index]?.scriptSig?.hex;

        if (scriptSigHex && isWitnessScript(scriptSigHex)) {
          inputData.witnessUtxo = {
            script: Buffer.from(input.script_hex, "hex"),
            value: input.value,
          };
          inputData.redeemScript = Buffer.from(scriptSigHex, "hex");
        } else if (scriptSigHex) {
          inputData.redeemScript = Buffer.from(scriptSigHex, "hex");
        } else {
          throw new AdamikApiServerError(`Missing scriptSig for P2SH input at index ${inputIndex}`);
        }
      }

      psbt.addInput(inputData);
    }

    // Enable RBF: https://github.com/bitcoin/bips/blob/master/bip-0125.mediawiki#summary
    // 0xfffffffd is stricly smaller than 0xffffffff - 1
    psbt.setInputSequence(inputIndex, 0xfffffffd);
  }

  // HANDLE OUTPUTS

  const psbtOutputs: PsbtOutputExtended[] = [];
  for (const out of outputs) {
    // value in out is always defined after calling selectionAlgorithm
    if ("value" in out) {
      // in case useMaxAmount is true, we need to overwrite the amount in the transaction with the amount selected by the algorithm
      if ("address" in out) {
        psbtOutputs.push(out);
      }
      // no address in the output, this is the change
      else {
        // Take the address of the first input, its as good as any other one
        // NOTE Not compliant with Bitcoin spec, ideally a new change address should be derived from the Xpub
        psbtOutputs.push({
          value: out.value,
          address: (inputs[0] as UtxoWithMetadata).address,
        });
      }
    }
  }

  psbt.addOutputs(psbtOutputs);

  return {
    psbt,
    fee,
  };
}

export {
  buildTransferPsbt,
  getCurrentBlockHeight,
  getNetworkForChainId,
  isP2SHScript,
  isTaprootAddress,
  isValidAddress,
  isValidTransactionHash,
  isValidXpub,
  isWitnessScript,
};
