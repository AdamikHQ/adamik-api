import {
  stakingTransaction as createStakingTransaction,
  unbondingTransaction as createUnbondingTransaction,
  StakingScriptData,
  StakingScripts,
  UTXO,
} from "@babylonlabs-io/btc-staking-ts";
import { Psbt } from "bitcoinjs-lib";
import coinSelect from "coinselect";
import split from "coinselect/split.js";
import { CHAINS } from "~/app/config/chains";
import { ChainId, Status, Transaction, TransactionMode } from "~/app/model/types_WIP";
import "~/app/tools/bigint";
import { statusFromMessage } from "~/app/tools/handlers/apiHandler";
import {
  AdamikApiServerError,
  InvalidTransactionError,
  UnsupportedFeatureError,
} from "~/app/tools/handlers/errors";
import { fetchGlobalParams } from "./backend/babylon";
import { fetchAddressesDashboard, fetchRawTransaction, fetchXpubDashboard } from "./backend/blockchair";
import { BlockchairRawTransactionData, UtxoWithMetadata } from "./backend/types";
import {
  getCurrentBlockHeight,
  getNetworkForChainId,
  isP2SHScript,
  isTaprootAddress,
  isValidXpub,
  isWitnessScript,
} from "./logic";
import { BitcoinChainParams, PsbtInputExtended, PsbtOutputExtended, PsbtWithFee } from "./types";

// TODO Also support withdraw transactions or not ?...
// - withdrawEarlyUnbondedTransaction
// - withdrawTimelockUnbondedTransaction

// (From babylon doc) "The amount of covenant emulator signatures required for the staking to be activated"
const BABYLON_COVENANT_THRESHOLD: number = 3;

// (From babylon doc) "The magic bytes appended to the data embed script used to identify the staking transaction on BTC"
const BABYLON_MAGIC_BYTES: Buffer = Buffer.from("62627434", "hex"); // "bbt4" tag

// Hardcoded to the max (~455 days)
const BABYLON_STAKING_DURATION: number = 65535;

// Hardcoded to 7 days
const BABYLON_UNBONDING_TIME: number = 1008;

function isSafeNumber(bigint: bigint): boolean {
  return bigint >= BigInt(Number.MIN_SAFE_INTEGER) && bigint <= BigInt(Number.MAX_SAFE_INTEGER);
}

async function buildStakingScripts(transaction: Transaction): Promise<StakingScripts> {
  if (transaction.data.mode !== TransactionMode.STAKE && transaction.data.mode !== TransactionMode.UNSTAKE) {
    throw new UnsupportedFeatureError(
      `Unsupported transaction mode ${transaction.data.mode} for chain bitcoin`
    );
  }

  if (!transaction.data.senderPubKey) {
    throw new InvalidTransactionError(statusFromMessage("Public key of the sender address must be provided"));
  }

  // substring because staker pubkey are expected without the coordinate bytes
  // https://github.com/babylonlabs-io/btc-staking-ts#define-staking-parameters
  const stakerPubKey: Buffer = Buffer.from(transaction.data.senderPubKey.substring(2), "hex");

  // TODO Only 1 validator at the moment, we could support several
  const validatorAddress =
    transaction.data.mode === TransactionMode.STAKE
      ? transaction.data.targetValidatorAddress
      : transaction.data.validatorAddress;
  const finalityProviders: Buffer[] = [Buffer.from(validatorAddress, "hex")];

  // A list of the public keys without the coordinate bytes,
  // corresponding to the covenant emulators
  const { covenant_pks: covenantPubKeysHex } = await fetchGlobalParams();
  // substring because covenant pubkeys are expected without the coordinate bytes
  // https://github.com/babylonlabs-io/btc-staking-ts#define-staking-parameters
  const covenantPks: Buffer[] = covenantPubKeysHex.map((pk) => Buffer.from(pk.substring(2), "hex"));

  const stakingScriptData = new StakingScriptData(
    stakerPubKey,
    finalityProviders,
    covenantPks,
    BABYLON_COVENANT_THRESHOLD,
    BABYLON_STAKING_DURATION,
    BABYLON_UNBONDING_TIME,
    BABYLON_MAGIC_BYTES
  );

  return stakingScriptData.buildScripts();
}

// Staking PSBT is built using the @babylonlabs-io/btc-staking-ts lib
async function buildStakingPsbt(
  chainId: ChainId,
  transaction: Transaction,
  stakingScripts: StakingScripts,
  feePerByte: number
): Promise<PsbtWithFee> {
  if (!!transaction.data.amount && !isSafeNumber(transaction.data.amount)) {
    console.warn("Bigint amount too large to be cast to Number:", transaction.data.amount);
    throw new AdamikApiServerError("Amount is too large to be cast as number");
  }

  const amount = Number(transaction.data.amount);

  const network = getNetworkForChainId(chainId);

  const { data } = isValidXpub(chainId, transaction.data.senderAddress)
    ? await fetchXpubDashboard(chainId, transaction.data.senderAddress)
    : await fetchAddressesDashboard(chainId, [transaction.data.senderAddress]);

  const allUtxos: UTXO[] =
    data?.utxo.map((utxo: UtxoWithMetadata) => ({
      txid: utxo.transaction_hash,
      vout: utxo.vout,
      value: utxo.value,
      scriptPubKey: utxo.script_hex!,
    })) || [];

  // Public key is needed only if the wallet is in Taproot mode
  const publicKeyNoCoord = ((): Buffer | undefined => {
    if (!isTaprootAddress(transaction.data.senderAddress)) {
      return undefined;
    }

    if (!transaction.data.senderPubKey) {
      throw new InvalidTransactionError(
        statusFromMessage("Public key of the sender address must be provided when it's a taproot address")
      );
    }

    Buffer.from(transaction.data.senderPubKey, "hex");
  })();

  // Take the address of the first input, its as good as any other one
  // FIXME Not compliant with Bitcoin spec, ideally a new change address should be derived from the Xpub
  const changeAddress = data?.utxo[0].address || "";

  const stakingTransaction = createStakingTransaction(
    stakingScripts,
    amount,
    changeAddress,
    allUtxos,
    network,
    feePerByte,
    publicKeyNoCoord
  );

  return stakingTransaction;
}

// Unbonding PSBT is built using the @babylonlabs-io/btc-staking-ts lib
// TODO Test this
async function buildUnbondingPsbt(
  chainId: ChainId,
  transaction: Transaction,
  stakingScripts: StakingScripts,
  feePerByte: number
): Promise<PsbtWithFee> {
  const network = getNetworkForChainId(chainId);

  const { psbt: stakingPsbt } = await buildStakingPsbt(chainId, transaction, stakingScripts, feePerByte);

  //const scripts = buildStakingScripts(transaction);

  // TODO Test this
  const stakingTransaction = stakingPsbt.extractTransaction();

  //const unbondingFee: number = 500;
  // Source: https://github.com/babylonlabs-io/btc-staking-ts#fee-calculation
  const txSize: number =
    stakingPsbt.txInputs.length * 180 +
    stakingPsbt.txOutputs.length * 34 +
    10 +
    stakingPsbt.txInputs.length +
    40;
  // FIXME No idea if this is valid
  const unbondingFee = txSize * feePerByte;

  const unbondingTransaction = createUnbondingTransaction(
    stakingScripts,
    stakingTransaction,
    unbondingFee,
    network
  );

  return {
    psbt: unbondingTransaction.psbt,
    fee: unbondingFee,
  };
}

// Transfer PSBT is built manually, only using the bitcoin-js lib
async function buildTransferPsbt(
  chainId: ChainId,
  transaction: Transaction,
  feePerByte: number,
  status: Status
): Promise<PsbtWithFee> {
  const chainParams = CHAINS[chainId].params as BitcoinChainParams;

  const psbt = new Psbt({ network: getNetworkForChainId(chainId) });

  const { data, context } = isValidXpub(chainId, transaction.data.senderAddress)
    ? await fetchXpubDashboard(chainId, transaction.data.senderAddress)
    : await fetchAddressesDashboard(chainId, [transaction.data.senderAddress]);

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
  const selectionAlgorithm = transaction.data.useMaxAmount ? split : coinSelect;
  const { inputs, outputs, fee } = selectionAlgorithm(
    allUtxos,
    [
      {
        address: transaction.data.recipientAddress,
        value: transaction.data.amount ? Number(transaction.data.amount) : undefined,
      },
    ],
    feePerByte
  );

  // inputs and outputs will be undefined if no solution was found
  if (!inputs || !outputs) {
    console.warn("No solution found during UTXO selection for transaction:", JSON.stringify(transaction));
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

    // TODO Do this for staking transactions too?
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
        // FIXME Not compliant with Bitcoin spec, ideally a new change address should be derived from the Xpub
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

export { buildStakingPsbt, buildStakingScripts, buildTransferPsbt, buildUnbondingPsbt };
