import { btcstakingtx } from "@babylonlabs-io/babylon-proto-ts";
import {
  BTCSigType,
  ProofOfPossessionBTC,
} from "@babylonlabs-io/babylon-proto-ts/dist/generated/babylon/btcstaking/v1/pop";
import {
  slashEarlyUnbondedTransaction as createSlashEarlyUnbondedTransaction,
  slashTimelockUnbondedTransaction as createSlashTimelockUnbondedTransaction,
  stakingTransaction as createStakingTransaction,
  unbondingTransaction as createUnbondingTransaction,
  findInputUTXO,
  getPsbtInputFields,
  StakingScriptData,
  StakingScripts,
  UTXO,
} from "@babylonlabs-io/btc-staking-ts";
import { EncodeObject as ProtoMsg } from "@cosmjs/proto-signing";
import {
  address,
  Network as BitcoinNetworkInfo,
  Transaction as BitcoinTransaction,
  payments,
  Psbt,
} from "bitcoinjs-lib";
import { Taptree } from "bitcoinjs-lib/src/types";
import coinSelect from "coinselect";
import split from "coinselect/split.js";
import { CHAINS } from "~/app/config/chains";
import {
  ChainId,
  RegisterStakeTransactionData,
  Status,
  TransactionData,
  TransactionMode,
} from "~/app/model/types_WIP";
import "~/app/tools/bigint";
import { statusFromMessage } from "~/app/tools/handlers/apiHandler";
import {
  AdamikApiServerError,
  InvalidTransactionError,
  UnsupportedFeatureError,
  UserInputError,
} from "~/app/tools/handlers/errors";
import { BabylonNetworkInfoV2 } from "./backend/babylon.types";
import {
  fetchAddressesDashboard,
  fetchFeePerByte as fetchFeePerByteBlockchair,
  fetchRawTransaction,
  fetchXpubDashboard,
} from "./backend/blockchair";
import {
  fetchAddressScriptPubKey,
  fetchAddressUtxos,
  fetchFeePerByte as fetchFeePerByteMempoolSpace,
} from "./backend/mempoolSpace";
import { BlockchairRawTransactionData } from "./backend/types";
import {
  clearTxSignatures,
  getCurrentBlockHeight,
  getNetworkForChainId,
  isP2SHScript,
  isValidXpub,
  isWitnessScript,
} from "./logic";
import {
  BitcoinChainParams,
  PsbtInputExtended,
  PsbtOutputExtended,
  PsbtWithFee,
  UtxoWithMetadata,
} from "./types";

// TODO Check when 'Staking' class is exposed by btc-staking-lib, and refacto everything to use it instead

// TODO Also support withdraw transactions or not ?...
// - withdrawEarlyUnbondedTransaction
// - withdrawTimelockUnbondedTransaction

// FIXME Babylon constants should go elsewhere

// Should be imported from btc-staking-lib instead, but it doesn't expose it...
// https://github.com/babylonlabs-io/btc-staking-ts/blob/de1d1cff3ef4ad45b5c61f0d7b11fd4479de278a/src/constants/registry.ts
export const BABYLON_REGISTRY_TYPE_URLS = {
  MsgCreateBTCDelegation: "/babylon.btcstaking.v1.MsgCreateBTCDelegation",
};
// No idea what that is, should be imported from btc-staking-lib instead, but it doesn't expose it...
// https://github.com/babylonlabs-io/btc-staking-ts/blob/de1d1cff3ef4ad45b5c61f0d7b11fd4479de278a/src/constants/transaction.ts
export const REDEEM_VERSION = 192;

// "internalPubkey denotes an unspendable internal public key to be used for the taproot output"
// Should be imported from btc-staking-lib instead, but it doesn't expose it...
// https://github.com/babylonlabs-io/btc-staking-ts/blob/de1d1cff3ef4ad45b5c61f0d7b11fd4479de278a/src/constants/internalPubkey.ts
export const TAPROOT_INTERNAL_PUBKEY = Buffer.from(
  "0250929b74c1a04954b78b4b6035e97a5e078a5a0f28ec96d547bfee9ace803ac0",
  "hex"
).subarray(1, 33); // Do a subarray(1, 33) to get the public coordinate

// "The amount of covenant emulator signatures required for the staking to be activated"
// https://github.com/babylonlabs-io/btc-staking-ts#define-staking-parameters
const BABYLON_COVENANT_THRESHOLD: number = 3;

// "The magic bytes appended to the data embed script used to identify the staking transaction on BTC"
// https://github.com/babylonlabs-io/btc-staking-ts#define-staking-parameters
//const BABYLON_MAGIC_BYTES: Buffer = Buffer.from("62627434", "hex"); // "bbt4" tag

// Length of a BTC public key without the coordinate, in bytes
const NO_COORD_PK_BYTE_LENGTH = 32;

// Hardcoded to the max (~455 days)
const BABYLON_STAKING_DURATION: number = 65535;

// Hardcoded to 7 days
const BABYLON_UNBONDING_TIME: number = 1008;

function isSafeNumber(bigint: bigint): boolean {
  return bigint >= BigInt(Number.MIN_SAFE_INTEGER) && bigint <= BigInt(Number.MAX_SAFE_INTEGER);
}

// 'covenantPubKeysHex' is a list of the public keys of covenant emulators, without the coordinate bytes
// Can be retrieved using fetchNetworkInfo from babylon provider
function buildStakingScripts(
  transactionData: TransactionData,
  babylonNetworkInfo: BabylonNetworkInfoV2
): StakingScripts {
  if (transactionData.mode !== TransactionMode.STAKE && transactionData.mode !== TransactionMode.UNSTAKE) {
    throw new UnsupportedFeatureError(
      `Unsupported transaction mode ${transactionData.mode} for chain bitcoin`
    );
  }

  if (!transactionData.senderPubKey) {
    throw new UserInputError("Public key of the sender address must be provided");
  }

  // substring because staker pubkey is expected without the coordinate bytes
  // https://github.com/babylonlabs-io/btc-staking-ts#define-staking-parameters
  const senderPubKeyNoCoord: Buffer = Buffer.from(transactionData.senderPubKey.substring(2), "hex");

  // TODO Only 1 validator at the moment, we could support several
  const validatorAddress =
    transactionData.mode === TransactionMode.STAKE
      ? transactionData.targetValidatorAddress
      : transactionData.validatorAddress;
  const finalityProviders: Buffer[] = [Buffer.from(validatorAddress, "hex")];

  const covenantPks: Buffer[] = babylonNetworkInfo.covenant_pks.map((pk) => Buffer.from(pk, "hex"));

  const stakingScriptData = new StakingScriptData(
    senderPubKeyNoCoord,
    finalityProviders,
    covenantPks,
    BABYLON_COVENANT_THRESHOLD,
    BABYLON_STAKING_DURATION,
    BABYLON_UNBONDING_TIME
  );

  return stakingScriptData.buildScripts();
}

async function buildStakingPsbt(
  chainId: ChainId,
  transactionData: TransactionData,
  scripts: StakingScripts,
  bitcoinNetworkInfo: BitcoinNetworkInfo
): Promise<{ transaction: BitcoinTransaction; psbt: Psbt; fee: number }> {
  if (!!transactionData.amount && !isSafeNumber(transactionData.amount)) {
    console.warn("Bigint amount too large to be cast to Number:", transactionData.amount);
    throw new AdamikApiServerError("Amount is too large to be cast as number");
  }

  const amount = Number(transactionData.amount);

  let changeAddress: string;
  let allUtxos: UTXO[];
  let feePerByte: number;

  // Using mempool.space for signet and blockchair for mainnet
  if (chainId === ChainId.BITCOIN_SIGNET) {
    feePerByte = await fetchFeePerByteMempoolSpace(chainId);

    if (isValidXpub(chainId, transactionData.senderAddress)) {
      console.warn("Xpub address used for bitcoin babylon staking");
      throw new UserInputError(`Xpub are not supported for ${chainId} staking transactions`);
    }
    const utxos = await fetchAddressUtxos(chainId, transactionData.senderAddress);
    const scriptPubKey = await fetchAddressScriptPubKey(chainId, transactionData.senderAddress);

    // Use the sender address as the change address
    // FIXME Not compliant with Bitcoin spec, ideally a new change address should be derived from the Xpub
    changeAddress = transactionData.senderAddress;

    // TODO Filter-out ordinals
    allUtxos = utxos.map((utxo) => ({
      txid: utxo.txid,
      value: utxo.value,
      vout: utxo.vout,
      scriptPubKey,
      // TODO? (KO, seems not required)
      // rawTxHex?: string;
      // redeemScript?: string;
      // witnessScript?: string;
    }));
  } else {
    feePerByte = await fetchFeePerByteBlockchair(chainId);

    const { data } = isValidXpub(chainId, transactionData.senderAddress)
      ? await fetchXpubDashboard(chainId, transactionData.senderAddress)
      : await fetchAddressesDashboard(chainId, [transactionData.senderAddress]);

    allUtxos =
      data?.utxo.map((utxo: UtxoWithMetadata) => ({
        txid: utxo.transaction_hash,
        vout: utxo.vout,
        value: utxo.value,
        scriptPubKey: utxo.script_hex!,
      })) || [];

    // Take the address of the first input, it's as good as any other one
    // FIXME Not compliant with Bitcoin spec, ideally a new change address should be derived from the Xpub
    changeAddress = data?.utxo[0].address || "";
  }

  if (!transactionData.senderPubKey) {
    throw new UserInputError("Public key of the sender address must be provided");
  }

  // substring because staker pubkey is expected without the coordinate bytes
  // https://github.com/babylonlabs-io/btc-staking-ts#define-staking-parameters
  const senderPubKeyNoCoord = Buffer.from(transactionData.senderPubKey.substring(2), "hex");

  const { transaction: stakingTransaction, fee } = createStakingTransaction(
    scripts,
    amount,
    changeAddress,
    allUtxos,
    bitcoinNetworkInfo,
    feePerByte
  );

  const stakingPsbt = stakingTransactionToPsbt(
    stakingTransaction,
    bitcoinNetworkInfo,
    allUtxos,
    senderPubKeyNoCoord
  );

  return {
    transaction: stakingTransaction,
    psbt: stakingPsbt,
    fee,
  };
}

function buildSlashingPsbt(
  scripts: StakingScripts,
  stakingTransaction: BitcoinTransaction,
  babylonNetworkInfo: BabylonNetworkInfoV2,
  bitcoinNetworkInfo: BitcoinNetworkInfo
): PsbtWithFee {
  try {
    const { psbt } = createSlashTimelockUnbondedTransaction(
      scripts,
      stakingTransaction,
      babylonNetworkInfo.slashing_pk_script,
      Number(babylonNetworkInfo.slashing_rate),
      babylonNetworkInfo.min_slashing_tx_fee_sat,
      bitcoinNetworkInfo
    );

    return {
      psbt,
      fee: babylonNetworkInfo.min_slashing_tx_fee_sat,
    };
  } catch (error) {
    console.warn("/!\\ Failed to build bitcoin slashing psbt:", error);
    throw new AdamikApiServerError(`Failed to build slashing psbt`);
  }
}

function buildUnbondingSlashingPsbt(
  scripts: StakingScripts,
  stakingTransaction: BitcoinTransaction,
  babylonNetworkInfo: BabylonNetworkInfoV2,
  bitcoinNetworkInfo: BitcoinNetworkInfo
): PsbtWithFee {
  try {
    const { psbt } = createSlashEarlyUnbondedTransaction(
      scripts,
      stakingTransaction,
      babylonNetworkInfo.slashing_pk_script,
      Number(babylonNetworkInfo.slashing_rate),
      babylonNetworkInfo.min_slashing_tx_fee_sat,
      bitcoinNetworkInfo
    );
    return {
      psbt,
      fee: babylonNetworkInfo.min_slashing_tx_fee_sat,
    };
  } catch (error) {
    console.warn("/!\\ Failed to build bitcoin unbonding slashing psbt:", error);
    throw new AdamikApiServerError(`Failed to build unbonding slashing psbt`);
  }
}

// The flow of the unbonding transaction is a bit different than the others, among all the babylon scenarios,
// and at some step we only need the Transaction object, not the Psbt
function buildUnbondingTransaction(
  scripts: StakingScripts,
  stakingTransaction: BitcoinTransaction,
  babylonNetworkInfo: BabylonNetworkInfoV2,
  bitcoinNetworkInfo: BitcoinNetworkInfo
): { transaction: BitcoinTransaction; fee: number } {
  // TODO Test this
  const { unbonding_fee_sat: unbondingFee } = babylonNetworkInfo;

  const { outputAddress } = deriveStakingOutputInfo(scripts, bitcoinNetworkInfo);
  const stakingOutputIndex = findMatchingTxOutputIndex(stakingTransaction, outputAddress, bitcoinNetworkInfo);

  const { transaction: unbondingTransaction } = createUnbondingTransaction(
    scripts,
    stakingTransaction,
    unbondingFee,
    bitcoinNetworkInfo,
    stakingOutputIndex
  );

  return {
    transaction: unbondingTransaction,
    fee: unbondingFee,
  };
}

// TODO Test this
function buildUnbondingPsbt(
  scripts: StakingScripts,
  stakingTransaction: BitcoinTransaction,
  babylonNetworkInfo: BabylonNetworkInfoV2,
  bitcoinNetworkInfo: BitcoinNetworkInfo
): PsbtWithFee {
  const { transaction: unbondingTransaction, fee: unbondingFee } = buildUnbondingTransaction(
    scripts,
    stakingTransaction,
    babylonNetworkInfo,
    bitcoinNetworkInfo
  );

  const unbondingPsbt = unbondingTransactionToPsbt(
    scripts,
    unbondingTransaction,
    stakingTransaction,
    bitcoinNetworkInfo
  );

  return {
    psbt: unbondingPsbt,
    fee: unbondingFee,
  };
}

// Transfer PSBT is built manually, only using the bitcoin-js lib
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

function buildBabylonRegistrationMessage(
  chainId: ChainId,
  transactionData: RegisterStakeTransactionData,
  babylonNetworkInfo: BabylonNetworkInfoV2
): ProtoMsg {
  //////////////////// Retrieve data from the input transaction

  // substring because staker pubkey is expected without the coordinate bytes
  // https://github.com/babylonlabs-io/btc-staking-ts#define-staking-parameters
  const btcPubKeyNoCoordHex = transactionData.senderPubKey.substring(2);

  const btcFinalityProviderPubKeyNoCoordHex = transactionData.validatorPubKey;

  // NOTE Weak conversion here...
  const btcStakingAmountSat = Number(transactionData.amount);

  const btcStakingTxHex = transactionData.signedStakingTransaction;
  const btcSignedSlashingPsbtHex = transactionData.signedSlashingTransaction;
  const btcSignedUnbondingSlashingPsbtHex = transactionData.signedUnbondingSlashingTransaction;
  const signedBbnAddress = transactionData.proofOfPossession;

  //////////////////// Prepare the data to build the cosmos message

  const btcStakingTx = Psbt.fromHex(btcStakingTxHex).extractTransaction();

  const bitcoinNetworkInfo = getNetworkForChainId(chainId);
  //const btcFeePerByte = await fetchFeePerByteMempoolSpace(chainId);
  const stakingScripts = buildStakingScripts(transactionData, babylonNetworkInfo);

  const { transaction: btcUnbondingTx, fee: btcUnbondingFee } = buildUnbondingTransaction(
    stakingScripts,
    btcStakingTx,
    babylonNetworkInfo,
    bitcoinNetworkInfo
  );

  const btcSignedSlashingTx = Psbt.fromHex(btcSignedSlashingPsbtHex).extractTransaction();
  const btcSlashingSignatures = extractSignatureFromTransaction(btcSignedSlashingTx);
  if (!btcSlashingSignatures) {
    throw new Error("No signature found in the staking output slashing PSBT");
  }
  const btcSignedUnbondingSlashingTx = Psbt.fromHex(btcSignedUnbondingSlashingPsbtHex).extractTransaction();
  const btcUnbondingSlashingSignatures = extractSignatureFromTransaction(btcSignedUnbondingSlashingTx);
  if (!btcUnbondingSlashingSignatures) {
    throw new Error("No signature found in the unbonding output slashing PSBT");
  }

  // Create Proof of Possession
  const ecdsaSig = Uint8Array.from(Buffer.from(signedBbnAddress, "hex"));
  const proofOfPossession: ProofOfPossessionBTC = {
    btcSigType: BTCSigType.ECDSA,
    btcSig: ecdsaSig,
  };

  //////////////////// Build the cosmos message

  const message: btcstakingtx.MsgCreateBTCDelegation = btcstakingtx.MsgCreateBTCDelegation.fromPartial({
    stakerAddr: transactionData.senderAddress,
    pop: proofOfPossession,
    btcPk: Uint8Array.from(Buffer.from(btcPubKeyNoCoordHex, "hex")),
    fpBtcPkList: [Uint8Array.from(Buffer.from(btcFinalityProviderPubKeyNoCoordHex, "hex"))],
    stakingTime: BABYLON_STAKING_DURATION,
    stakingValue: btcStakingAmountSat,
    stakingTx: Uint8Array.from(btcStakingTx.toBuffer()),
    slashingTx: Uint8Array.from(Buffer.from(clearTxSignatures(btcSignedSlashingTx).toHex(), "hex")),
    delegatorSlashingSig: Uint8Array.from(btcSlashingSignatures),
    unbondingTime: BABYLON_UNBONDING_TIME,
    unbondingTx: Uint8Array.from(btcUnbondingTx.toBuffer()),
    unbondingValue: btcStakingAmountSat - btcUnbondingFee,
    unbondingSlashingTx: Uint8Array.from(
      Buffer.from(clearTxSignatures(btcSignedUnbondingSlashingTx).toHex(), "hex")
    ),
    delegatorUnbondingSlashingSig: Uint8Array.from(btcUnbondingSlashingSignatures),
    // Inclusion proof is required in post-stake registration,
    // but not in pre-stake registration, which is the one we support
    // https://github.com/babylonlabs-io/babylon/blob/ec7488f11f5c818b74d39c2771ac0d39a9ebed5a/docs/register-bitcoin-stake.md#explanation-of-fields
    //stakingTxInclusionProof: inclusionProof,
  });

  return {
    typeUrl: BABYLON_REGISTRY_TYPE_URLS.MsgCreateBTCDelegation,
    value: message,
  };
}

// From https://github.com/babylonlabs-io/btc-staking-ts/blob/de1d1cff3ef4ad45b5c61f0d7b11fd4479de278a/src/staking/manager.ts#L794
const extractSignatureFromTransaction = (signedTransaction: BitcoinTransaction): Buffer | undefined => {
  // Loop through each input to extract the witness signature
  for (const input of signedTransaction.ins) {
    if (input.witness && input.witness.length > 0) {
      const schnorrSignature = input.witness[0];

      // Check that it's a 64-byte Schnorr signature
      if (schnorrSignature.length === 64) {
        return schnorrSignature; // Return the first valid signature found
      }
    }
  }
  return undefined;
};

// FIXME Everything below should be imported from btc-staking-lib instead, but it doesn't expose it...

/**
 * Convert a staking transaction to a PSBT.
 *
 * @param {Transaction} stakingTransaction - The staking transaction to convert to PSBT.
 * @param {Network} network - The network to use for the PSBT.
 * @param {UTXO[]} inputUTXOs - The UTXOs to be used as inputs for the staking
 * transaction.
 * @param {Buffer} [publicKeyNoCoord] - The public key of staker (optional)
 * @returns {Psbt} - The PSBT for the staking transaction.
 * @throws {Error} If unable to create PSBT from transaction
 */
const stakingTransactionToPsbt = (
  stakingTransaction: BitcoinTransaction,
  bitcoinNetworkInfo: BitcoinNetworkInfo,
  inputUTXOs: UTXO[],
  publicKeyNoCoord?: Buffer
): Psbt => {
  if (publicKeyNoCoord && publicKeyNoCoord.length !== NO_COORD_PK_BYTE_LENGTH) {
    throw new Error("Invalid public key");
  }

  const psbt = new Psbt({ network: bitcoinNetworkInfo });

  if (stakingTransaction.version !== undefined) psbt.setVersion(stakingTransaction.version);
  if (stakingTransaction.locktime !== undefined) psbt.setLocktime(stakingTransaction.locktime);

  stakingTransaction.ins.forEach((input) => {
    const inputUTXO = findInputUTXO(inputUTXOs, input);
    const psbtInputData = getPsbtInputFields(inputUTXO, publicKeyNoCoord);

    psbt.addInput({
      hash: input.hash,
      index: input.index,
      sequence: input.sequence,
      ...psbtInputData,
    });
  });

  stakingTransaction.outs.forEach((o) => {
    psbt.addOutput({ script: o.script, value: o.value });
  });

  return psbt;
};

const unbondingTransactionToPsbt = (
  scripts: {
    unbondingScript: Buffer;
    timelockScript: Buffer;
    slashingScript: Buffer;
    unbondingTimelockScript: Buffer;
  },
  unbondingTransaction: BitcoinTransaction,
  stakingTransaction: BitcoinTransaction,
  bitcoinNetworkInfo: BitcoinNetworkInfo
): Psbt => {
  if (unbondingTransaction.outs.length !== 1) {
    console.warn("/!\\ Unbonding transaction must have exactly one output");
    throw new AdamikApiServerError("Unbonding transaction must have exactly one output");
  }
  if (unbondingTransaction.ins.length !== 1) {
    console.warn("/!\\ Unbonding transaction must have exactly one input");
    throw new AdamikApiServerError("Unbonding transaction must have exactly one input");
  }

  validateUnbondingOutput(scripts, unbondingTransaction, bitcoinNetworkInfo);

  const psbt = new Psbt({ network: bitcoinNetworkInfo });

  if (unbondingTransaction.version !== undefined) {
    psbt.setVersion(unbondingTransaction.version);
  }
  if (unbondingTransaction.locktime !== undefined) {
    psbt.setLocktime(unbondingTransaction.locktime);
  }

  const input = unbondingTransaction.ins[0];
  const outputIndex = input.index;

  // Build input tapleaf script
  const inputScriptTree: Taptree = [
    { output: scripts.slashingScript },
    [{ output: scripts.unbondingScript }, { output: scripts.timelockScript }],
  ];

  // This is the tapleaf we are actually spending
  const inputRedeem = {
    output: scripts.unbondingScript,
    redeemVersion: REDEEM_VERSION,
  };

  // Create a P2TR payment that includes scriptTree + redeem
  const p2tr = payments.p2tr({
    internalPubkey: TAPROOT_INTERNAL_PUBKEY,
    scriptTree: inputScriptTree,
    redeem: inputRedeem,
    network: bitcoinNetworkInfo,
  });

  const inputTapLeafScript = {
    leafVersion: inputRedeem.redeemVersion,
    script: inputRedeem.output,
    controlBlock: p2tr.witness![p2tr.witness!.length - 1],
  };

  psbt.addInput({
    hash: input.hash,
    index: input.index,
    sequence: input.sequence,
    tapInternalKey: TAPROOT_INTERNAL_PUBKEY,
    witnessUtxo: {
      value: stakingTransaction.outs[outputIndex].value,
      script: stakingTransaction.outs[outputIndex].script,
    },
    tapLeafScript: [inputTapLeafScript],
  });

  psbt.addOutput({
    script: unbondingTransaction.outs[0].script,
    value: unbondingTransaction.outs[0].value,
  });

  return psbt;
};

/**
 * Validate the unbonding output for a given unbonding transaction.
 *
 * @param {Object} scripts - The scripts to use for the unbonding output.
 * @param {Transaction} unbondingTransaction - The unbonding transaction.
 * @param {Network} network - The network to use for the unbonding output.
 */
const validateUnbondingOutput = (
  scripts: {
    slashingScript: Buffer;
    unbondingTimelockScript: Buffer;
  },
  unbondingTransaction: BitcoinTransaction,
  bitcoinNetworkInfo: BitcoinNetworkInfo
) => {
  const unbondingOutputInfo = deriveUnbondingOutputInfo(scripts, bitcoinNetworkInfo);
  if (
    unbondingOutputInfo.scriptPubKey.toString("hex") !== unbondingTransaction.outs[0].script.toString("hex")
  ) {
    console.warn("/!\\ Unbonding output script does not match the expected script while building psbt");
    throw new AdamikApiServerError(
      "Unbonding output script does not match the expected script while building psbt"
    );
  }
};

/**
 * Derive the staking output address from the staking scripts.
 *
 * @param {StakingScripts} scripts - The staking scripts.
 * @param {Network} network - The Bitcoin network.
 * @returns {StakingOutput} - The staking output address and scriptPubKey.
 * @throws {StakingError} - If the staking output address cannot be derived.
 */
export const deriveStakingOutputInfo = (
  scripts: {
    timelockScript: Buffer;
    unbondingScript: Buffer;
    slashingScript: Buffer;
  },
  bitcoinNetworkInfo: BitcoinNetworkInfo
) => {
  // Build outputs
  const scriptTree: Taptree = [
    {
      output: scripts.slashingScript,
    },
    [{ output: scripts.unbondingScript }, { output: scripts.timelockScript }],
  ];

  // Create an pay-2-taproot (p2tr) output using the staking script
  const stakingOutput = payments.p2tr({
    internalPubkey: TAPROOT_INTERNAL_PUBKEY,
    scriptTree,
    network: bitcoinNetworkInfo,
  });

  if (!stakingOutput.address) {
    console.warn("/!\\ Failed to build bitcoin staking output");
    throw new AdamikApiServerError("Failed to build staking output");
  }

  return {
    outputAddress: stakingOutput.address,
    scriptPubKey: address.toOutputScript(stakingOutput.address, bitcoinNetworkInfo),
  };
};

/**
 * Derive the unbonding output address and scriptPubKey from the staking scripts.
 *
 * @param {StakingScripts} scripts - The staking scripts.
 * @param {Network} network - The Bitcoin network.
 * @returns {OutputInfo} - The unbonding output address and scriptPubKey.
 * @throws {StakingError} - If the unbonding output address cannot be derived.
 */
const deriveUnbondingOutputInfo = (
  scripts: {
    unbondingTimelockScript: Buffer;
    slashingScript: Buffer;
  },
  bitcoinNetworkInfo: BitcoinNetworkInfo
) => {
  const outputScriptTree: Taptree = [
    {
      output: scripts.slashingScript,
    },
    { output: scripts.unbondingTimelockScript },
  ];

  const unbondingOutput = payments.p2tr({
    internalPubkey: TAPROOT_INTERNAL_PUBKEY,
    scriptTree: outputScriptTree,
    network: bitcoinNetworkInfo,
  });

  if (!unbondingOutput.address) {
    console.warn("/!\\ Failed to build bitcoin unbonding output");
    throw new AdamikApiServerError("Failed to build unbonding output");
  }

  return {
    outputAddress: unbondingOutput.address,
    scriptPubKey: address.toOutputScript(unbondingOutput.address, bitcoinNetworkInfo),
  };
};

/**
 * Find the matching output index for the given transaction.
 *
 * @param {Transaction} transaction - The transaction.
 * @param {string} outputAddress - The output address.
 * @param {Network} network - The Bitcoin network.
 * @returns {number} - The output index.
 * @throws {Error} - If the matching output is not found.
 */
export const findMatchingTxOutputIndex = (
  transaction: BitcoinTransaction,
  outputAddress: string,
  bitcoinNetworkInfo: BitcoinNetworkInfo
) => {
  const index = transaction.outs.findIndex((output) => {
    return address.fromOutputScript(output.script, bitcoinNetworkInfo) === outputAddress;
  });

  if (index === -1) {
    console.warn("/!\\ Matching output not found for bitcoin address:", outputAddress);
    throw new AdamikApiServerError(`Matching output not found for address: ${outputAddress}`);
  }

  return index;
};

export {
  BABYLON_STAKING_DURATION,
  BABYLON_UNBONDING_TIME,
  buildBabylonRegistrationMessage,
  buildSlashingPsbt,
  buildStakingPsbt,
  buildStakingScripts,
  buildTransferPsbt,
  buildUnbondingPsbt,
  buildUnbondingSlashingPsbt,
  buildUnbondingTransaction,
  unbondingTransactionToPsbt,
};
