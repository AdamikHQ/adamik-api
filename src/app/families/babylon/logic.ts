import { btcstakingtx } from "@babylonlabs-io/babylon-proto-ts";
import {
  BTCSigType,
  ProofOfPossessionBTC,
} from "@babylonlabs-io/babylon-proto-ts/dist/generated/babylon/btcstaking/v1/pop";
import {
  createCovenantWitness,
  slashEarlyUnbondedTransaction as createSlashEarlyUnbondedTransaction,
  slashTimelockUnbondedTransaction as createSlashTimelockUnbondedTransaction,
  stakingTransaction as createStakingTransaction,
  unbondingTransaction as createUnbondingTransaction,
  findInputUTXO,
  getBabylonParamByBtcHeight,
  getPsbtInputFields,
  StakingParams,
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
import { add, differenceInCalendarDays, differenceInWeeks, formatDistanceStrict } from "date-fns";
import { CHAINS } from "~/app/config/chains";
import {
  fetchAddressUTXOs,
  fetchFeePerByte as fetchFeePerByteBlockchair,
  fetchXpubUTXOs,
} from "~/app/families/bitcoin/backend/blockchair";
import {
  fetchAddressScriptPubKey,
  fetchAddressUtxos,
  fetchLatestBlockHeight as fetchBitcoinLatestBlockHeight,
  fetchFeePerByte as fetchFeePerByteMempoolSpace,
} from "~/app/families/bitcoin/backend/mempoolSpace";
import { getNetworkForChainId, isValidXpub } from "~/app/families/bitcoin/logic";
import { PsbtWithFee, UtxoWithMetadata } from "~/app/families/bitcoin/types";
import {
  ChainId,
  ProviderType,
  RegisterStakeTransactionData,
  TransactionData,
  TransactionMode,
  TransactionState,
  UnstakeTransactionData,
} from "~/app/model/types_WIP";
import { validateSafeNumber } from "~/app/tools/amount";
import "~/app/tools/bigint";
import { statusFromMessage } from "~/app/tools/handlers/apiHandler";
import {
  AdamikApiServerError,
  InvalidTransactionError,
  UnsupportedFeatureError,
  UserInputError,
} from "~/app/tools/handlers/errors";
import { fetchAllBabylonStakingParams, fetchBabylonDelegation } from "./backend/babylonAPI";
import { BabylonDelegationState, BabylonDelegationV2 } from "./backend/babylonAPI.types";
import { BabylonMsgCreateBTCDelegation, CURRENT_BABYLON_BITCOIN_CHAIN } from "./types";

/**
 * This file contains the logic specific to the Babylon Staking feature,
 * it is put apart because it spans both bitcoin and cosmos families
 * and it uses babylon-specific logic and libraries
 */

// TODO Check when 'Staking' class is exposed by btc-staking-lib, and refacto everything to use it instead

// TODO Also support withdraw transactions or not ?...
// - withdrawEarlyUnbondedTransaction
// - withdrawTimelockUnbondedTransaction

// No idea what that is, should be imported from btc-staking-lib instead, but it doesn't expose it...
// https://github.com/babylonlabs-io/btc-staking-ts/blob/de1d1cff3ef4ad45b5c61f0d7b11fd4479de278a/src/constants/transaction.ts
const REDEEM_VERSION = 192;

// "internalPubkey denotes an unspendable internal public key to be used for the taproot output"
// Should be imported from btc-staking-lib instead, but it doesn't expose it...
// https://github.com/babylonlabs-io/btc-staking-ts/blob/de1d1cff3ef4ad45b5c61f0d7b11fd4479de278a/src/constants/internalPubkey.ts
const TAPROOT_INTERNAL_PUBKEY = Buffer.from(
  "0250929b74c1a04954b78b4b6035e97a5e078a5a0f28ec96d547bfee9ace803ac0",
  "hex"
).subarray(1, 33); // Do a subarray(1, 33) to get the public coordinate

function buildStakingScripts(
  transactionData: TransactionData,
  babylonStakingParams: StakingParams
): StakingScripts {
  if (
    transactionData.mode !== TransactionMode.STAKE &&
    transactionData.mode !== TransactionMode.UNSTAKE &&
    transactionData.mode !== TransactionMode.REGISTER_STAKE
  ) {
    throw new UnsupportedFeatureError(
      `Unsupported transaction mode ${transactionData.mode} for chain bitcoin`
    );
  }

  if (!transactionData.senderPubKey) {
    throw new UserInputError("Public key of the sender address must be provided");
  }

  // substring because staker pubkey is expected without the coordinate bytes
  const senderPubKeyNoCoord: Buffer = Buffer.from(transactionData.senderPubKey.substring(2), "hex");

  // TODO Only 1 validator at the moment, we could support several
  const validatorAddress =
    transactionData.mode === TransactionMode.REGISTER_STAKE
      ? transactionData.validatorPubKey
      : transactionData.mode === TransactionMode.STAKE
      ? transactionData.targetValidatorAddress
      : transactionData.validatorAddress;
  const finalityProviders: Buffer[] = [Buffer.from(validatorAddress, "hex")];

  const covenantPks: Buffer[] = babylonStakingParams.covenantNoCoordPks.map((pk) => Buffer.from(pk, "hex"));

  const stakingScriptData = new StakingScriptData(
    senderPubKeyNoCoord,
    finalityProviders,
    covenantPks,
    babylonStakingParams.covenantQuorum,
    babylonStakingParams.minStakingTimeBlocks,
    babylonStakingParams.unbondingTime
  );

  return stakingScriptData.buildScripts();
}

async function buildStakingPsbt(
  chainId: ChainId,
  transactionData: TransactionData,
  scripts: StakingScripts,
  bitcoinNetworkInfo: BitcoinNetworkInfo
): Promise<{ transaction: BitcoinTransaction; psbt: Psbt; fee: number }> {
  const chain = CHAINS[chainId];

  const mempoolSpaceSupported = chain.providers.find((p) => p.type === ProviderType.mempoolspace);
  const blockchairSupported = chain.providers.find((p) => p.type === ProviderType.blockchair);

  validateSafeNumber(transactionData.amount);
  const amount = Number(transactionData.amount);

  // Use the sender address as the change address
  // NOTE Not compliant with Bitcoin spec, ideally a new change address should be derived from the Xpub
  const changeAddress = transactionData.senderAddress;

  let feePerByte: number;
  let babylonUtxos: UTXO[];

  if (mempoolSpaceSupported) {
    feePerByte = await fetchFeePerByteMempoolSpace(chainId);

    const allUtxos = await fetchAddressUtxos(chainId, transactionData.senderAddress);
    const scriptPubKey = await fetchAddressScriptPubKey(chainId, transactionData.senderAddress);

    // TODO Filter-out ordinals
    babylonUtxos = allUtxos.map((utxo) => ({
      txid: utxo.txid,
      value: utxo.value,
      vout: utxo.vout,
      scriptPubKey,
    }));
  } else if (blockchairSupported) {
    feePerByte = await fetchFeePerByteBlockchair(chainId);

    const allUtxos = isValidXpub(chainId, transactionData.senderAddress)
      ? await fetchXpubUTXOs(chainId, transactionData.senderAddress)
      : await fetchAddressUTXOs(chainId, transactionData.senderAddress);

    babylonUtxos =
      allUtxos.map((utxo: UtxoWithMetadata) => ({
        txid: utxo.transaction_hash,
        vout: utxo.vout,
        value: utxo.value,
        scriptPubKey: utxo.script_hex!,
      })) || [];
  } else {
    throw new UnsupportedFeatureError(`No data provider available for chain ${chainId}`);
  }

  if (!transactionData.senderPubKey) {
    throw new UserInputError("Public key of the sender address must be provided");
  }

  // substring because staker pubkey is expected without the coordinate bytes
  const senderPubKeyNoCoord = Buffer.from(transactionData.senderPubKey.substring(2), "hex");

  const { transaction: stakingTransaction, fee } = createStakingTransaction(
    scripts,
    amount,
    changeAddress,
    babylonUtxos,
    bitcoinNetworkInfo,
    feePerByte
  );

  const stakingPsbt = stakingTransactionToPsbt(
    stakingTransaction,
    bitcoinNetworkInfo,
    babylonUtxos,
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
  babylonStakingParams: StakingParams,
  bitcoinNetworkInfo: BitcoinNetworkInfo
): PsbtWithFee {
  if (!babylonStakingParams.slashing) {
    throw new AdamikApiServerError("Slashing parameters are required but not provided");
  }

  try {
    const { psbt } = createSlashTimelockUnbondedTransaction(
      scripts,
      stakingTransaction,
      babylonStakingParams.slashing.slashingPkScriptHex,
      babylonStakingParams.slashing.slashingRate,
      babylonStakingParams.slashing.minSlashingTxFeeSat,
      bitcoinNetworkInfo
    );

    return {
      psbt,
      fee: babylonStakingParams.slashing.minSlashingTxFeeSat,
    };
  } catch (error: any) {
    console.warn("/!\\ Failed to build bitcoin slashing psbt:", error);
    if (error?.includes && error.includes("amount is less than dust limit")) {
      throw new InvalidTransactionError(statusFromMessage(`Balance is too low`));
    } else {
      throw new AdamikApiServerError(`Failed to build slashing psbt`);
    }
  }
}

function buildUnbondingSlashingPsbt(
  scripts: StakingScripts,
  unbondingTransaction: BitcoinTransaction,
  babylonStakingParams: StakingParams,
  bitcoinNetworkInfo: BitcoinNetworkInfo
): PsbtWithFee {
  if (!babylonStakingParams.slashing) {
    throw new AdamikApiServerError("Slashing parameters are required but not provided");
  }

  try {
    const { psbt } = createSlashEarlyUnbondedTransaction(
      scripts,
      unbondingTransaction,
      babylonStakingParams.slashing.slashingPkScriptHex,
      babylonStakingParams.slashing.slashingRate,
      babylonStakingParams.slashing.minSlashingTxFeeSat,
      bitcoinNetworkInfo
    );
    return {
      psbt,
      fee: babylonStakingParams.slashing.minSlashingTxFeeSat,
    };
  } catch (error: any) {
    console.warn("/!\\ Failed to build bitcoin unbonding slashing psbt:", error);
    if (error?.includes && error.includes("amount is less than dust limit")) {
      throw new InvalidTransactionError(statusFromMessage(`Balance is too low`));
    } else {
      throw new AdamikApiServerError(`Failed to build slashing psbt`);
    }
  }
}

// The flow of the unbonding transaction is a bit different than the others, among all the babylon scenarios,
// and at some step we only need the Transaction object, not the Psbt
function buildUnbondingTransaction(
  scripts: StakingScripts,
  stakingTransaction: BitcoinTransaction,
  babylonStakingParams: StakingParams,
  bitcoinNetworkInfo: BitcoinNetworkInfo
): { transaction: BitcoinTransaction; fee: number } {
  const { unbondingFeeSat: unbondingFee } = babylonStakingParams;

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
  babylonStakingParams: StakingParams,
  bitcoinNetworkInfo: BitcoinNetworkInfo
): { transaction: BitcoinTransaction; psbt: Psbt; fee: number } {
  const { transaction: unbondingTransaction, fee: unbondingFee } = buildUnbondingTransaction(
    scripts,
    stakingTransaction,
    babylonStakingParams,
    bitcoinNetworkInfo
  );

  const unbondingPsbt = unbondingTransactionToPsbt(
    scripts,
    unbondingTransaction,
    stakingTransaction,
    bitcoinNetworkInfo
  );

  return {
    transaction: unbondingTransaction,
    psbt: unbondingPsbt,
    fee: unbondingFee,
  };
}

// Used to get the unbonding psbt, from the unbonding
// transaction inside a delegation retrieved from the babylon API
async function retrieveUnbondingPsbtFromDelegation(
  chainId: ChainId,
  transactionData: UnstakeTransactionData,
  babylonDelegation: BabylonDelegationV2
): Promise<{ unbondingPsbt: Psbt; unbondingFees: bigint }> {
  const babylonStakingParams = await getBabylonStakingParamsByVersion(babylonDelegation.data.params_version);
  if (!babylonStakingParams) {
    console.warn(`/!\\ Staking params version not found for stake ID ${transactionData.stakeId}`);
    throw new AdamikApiServerError(
      `Staking params version not found for stake ID ${transactionData.stakeId}`
    );
  }

  const stakingTransaction = BitcoinTransaction.fromHex(
    babylonDelegation.data.delegation_staking.staking_tx_hex
  );
  const unbondingTransaction = BitcoinTransaction.fromHex(
    babylonDelegation.data.delegation_unbonding.unbonding_tx
  );

  const bitcoinNetworkInfo = getNetworkForChainId(chainId);

  const unbondingPsbt = unbondingTransactionToPsbt(
    buildStakingScripts(transactionData, babylonStakingParams),
    unbondingTransaction,
    stakingTransaction,
    bitcoinNetworkInfo
  );

  const unbondingFees = BigInt(babylonStakingParams.unbondingFeeSat);

  return {
    unbondingPsbt,
    unbondingFees,
  };
}

// From https://github.com/babylonlabs-io/btc-staking-ts/blob/bec554d159a0aebfaa6b163cb31eaf7389b09e78/src/staking/manager.ts#L457-L472
async function finalizeUnbondingBroadcastPayload(
  transactionData: UnstakeTransactionData,
  signedUnbondingTransaction: BitcoinTransaction
): Promise<BitcoinTransaction> {
  if (!transactionData.stakeId?.length) {
    throw new AdamikApiServerError(`Missing 'stakeId' field in transaction`);
  }

  const babylonDelegation = await fetchBabylonDelegation(transactionData.stakeId);
  if (!babylonDelegation) {
    console.warn(`/!\\ Staking position not found for stake ID ${transactionData.stakeId}`);
    throw new UserInputError(`Staking position not found for stake ID ${transactionData.stakeId}`);
  }

  const babylonStakingParams = await getBabylonStakingParamsByVersion(babylonDelegation.data.params_version);
  if (!babylonStakingParams) {
    console.warn(`/!\\ Staking params version not found for stake ID ${transactionData.stakeId}`);
    throw new AdamikApiServerError(`Staking params not found for stake ID ${transactionData.stakeId}`);
  }

  // Add covenant unbonding signatures

  const covenantBuffers = babylonStakingParams.covenantNoCoordPks.map((covenant) =>
    Buffer.from(covenant, "hex")
  );
  const witness = createCovenantWitness(
    // Since unbonding transactions always have a single input and output,
    // we expect exactly one signature in TaprootScriptSpendSig when the
    // signing is successful
    signedUnbondingTransaction.ins[0].witness,
    covenantBuffers,
    babylonDelegation.data.delegation_unbonding.covenant_unbonding_signatures.map((sig) => ({
      btcPkHex: sig.covenant_btc_pk_hex,
      sigHex: sig.signature_hex,
    })),
    babylonStakingParams.covenantQuorum
  );

  // Overwrite the witness to include the covenant unbonding signatures
  signedUnbondingTransaction.ins[0].witness = witness;

  return signedUnbondingTransaction;
}

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
  if (publicKeyNoCoord && publicKeyNoCoord.length !== 32) {
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
const deriveStakingOutputInfo = (
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
const findMatchingTxOutputIndex = (
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

/**
 * Clears the signatures from a transaction.
 * @param tx - The transaction to clear the signatures from.
 * @returns The transaction with the signatures cleared.
 */
const clearTxSignatures = (tx: BitcoinTransaction): BitcoinTransaction => {
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
// FIXME Currently unused??
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

async function buildBabylonStakingPayloads(
  chainId: ChainId,
  transactionData: TransactionData
): Promise<{
  stakingPsbt: Psbt;
  slashingPsbt: Psbt;
  unbondingSlashingPsbt: Psbt;
  unbondingTransaction: BitcoinTransaction;
  fees: number;
}> {
  const babylonStakingParams = await getCurrentBabylonStakingParams();
  const bitcoinNetworkInfo = getNetworkForChainId(chainId);
  const stakingScripts = buildStakingScripts(transactionData, babylonStakingParams);

  const {
    transaction: stakingTransaction,
    psbt: stakingPsbt,
    fee: fees,
  } = await buildStakingPsbt(chainId, transactionData, stakingScripts, bitcoinNetworkInfo);

  const { transaction: unbondingTransaction } = buildUnbondingPsbt(
    stakingScripts,
    stakingTransaction,
    babylonStakingParams,
    bitcoinNetworkInfo
  );

  const { psbt: slashingPsbt } = buildSlashingPsbt(
    stakingScripts,
    stakingTransaction,
    babylonStakingParams,
    bitcoinNetworkInfo
  );
  const { psbt: unbondingSlashingPsbt } = buildUnbondingSlashingPsbt(
    stakingScripts,
    unbondingTransaction,
    babylonStakingParams,
    bitcoinNetworkInfo
  );

  return {
    stakingPsbt,
    slashingPsbt,
    unbondingSlashingPsbt,
    unbondingTransaction,
    fees,
  };
}

async function buildBabylonRegistrationMessage(
  transactionData: RegisterStakeTransactionData
): Promise<ProtoMsg> {
  //////////////////// Retrieve data from the input transaction

  // substring because staker pubkey is expected without the coordinate bytes
  const bitcoinPubKeyNoCoordHex = transactionData.senderForeignPubKey.substring(2);

  const bitcoinFinalityProviderPubKeyNoCoordHex = transactionData.validatorPubKey;

  validateSafeNumber(transactionData.amount);
  const bitcoinStakingAmountSat = Number(transactionData.amount);

  const bitcoinStakingTransactionHex = transactionData.signedStakingTransaction;
  const bitcoinSignedSlashingTransactionHex = transactionData.signedSlashingTransaction;
  const bitcoinUnbondingTransactionHex = transactionData.unsignedUnbondingTransaction;
  const bitcoinSignedUnbondingSlashingTransactionHex = transactionData.signedUnbondingSlashingTransaction;
  const signedBabylonAddress = transactionData.proofOfPossession;

  //////////////////// Prepare the data to build the babylon message

  const bitcoinStakingTransaction = Psbt.fromHex(bitcoinStakingTransactionHex).extractTransaction();

  const bitcoinUnbondingTransaction = BitcoinTransaction.fromHex(bitcoinUnbondingTransactionHex);

  const bitcoinSignedSlashingTransaction = Psbt.fromHex(
    bitcoinSignedSlashingTransactionHex
  ).extractTransaction();
  const bitcoinSlashingSignatures = extractSignatureFromTransaction(bitcoinSignedSlashingTransaction);
  if (!bitcoinSlashingSignatures) {
    throw new Error("No signature found in the staking output slashing PSBT");
  }

  const bitcoinSignedUnbondingSlashingTransaction = Psbt.fromHex(
    bitcoinSignedUnbondingSlashingTransactionHex
  ).extractTransaction();
  const bitcoinUnbondingSlashingSignatures = extractSignatureFromTransaction(
    bitcoinSignedUnbondingSlashingTransaction
  );
  if (!bitcoinUnbondingSlashingSignatures) {
    throw new Error("No signature found in the unbonding output slashing PSBT");
  }

  // Create Proof of Possession
  const ecdsaSig = Uint8Array.from(Buffer.from(signedBabylonAddress, "hex"));
  const proofOfPossession: ProofOfPossessionBTC = {
    btcSigType: BTCSigType.ECDSA,
    btcSig: ecdsaSig,
  };

  const babylonStakingParams = await getCurrentBabylonStakingParams();

  //////////////////// Build the cosmos message

  const message: btcstakingtx.MsgCreateBTCDelegation = btcstakingtx.MsgCreateBTCDelegation.fromPartial({
    stakerAddr: transactionData.senderAddress,
    pop: proofOfPossession,
    btcPk: Uint8Array.from(Buffer.from(bitcoinPubKeyNoCoordHex, "hex")),
    fpBtcPkList: [Uint8Array.from(Buffer.from(bitcoinFinalityProviderPubKeyNoCoordHex, "hex"))],
    stakingTime: babylonStakingParams.minStakingTimeBlocks,
    stakingValue: bitcoinStakingAmountSat,
    stakingTx: Uint8Array.from(clearTxSignatures(bitcoinStakingTransaction).toBuffer()),
    slashingTx: Uint8Array.from(clearTxSignatures(bitcoinSignedSlashingTransaction).toBuffer()),
    delegatorSlashingSig: Uint8Array.from(bitcoinSlashingSignatures),
    unbondingTime: babylonStakingParams.unbondingTime,
    unbondingTx: Uint8Array.from(bitcoinUnbondingTransaction.toBuffer()),
    unbondingValue: bitcoinStakingAmountSat - babylonStakingParams.unbondingFeeSat,
    unbondingSlashingTx: Uint8Array.from(
      clearTxSignatures(bitcoinSignedUnbondingSlashingTransaction).toBuffer()
    ),
    delegatorUnbondingSlashingSig: Uint8Array.from(bitcoinUnbondingSlashingSignatures),
    // Inclusion proof is required in post-stake registration,
    // but not in pre-stake registration, which is the one we support
    // https://github.com/babylonlabs-io/babylon/blob/ec7488f11f5c818b74d39c2771ac0d39a9ebed5a/docs/register-bitcoin-stake.md#explanation-of-fields
    //stakingTxInclusionProof: inclusionProof,
  });

  return {
    typeUrl: "/babylon.btcstaking.v1.MsgCreateBTCDelegation",
    value: btcstakingtx.MsgCreateBTCDelegation.encode(message).finish(),
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

async function getBabylonDelegationState(message: BabylonMsgCreateBTCDelegation): Promise<TransactionState> {
  // 1 - parse the babylon message to retrieve the bitcoin staking tx
  const bitcoinTransactionId = BitcoinTransaction.fromBuffer(
    Buffer.from(message.staking_tx, "base64")
  ).getId();

  // 2 - from the bitcoin tx id, fetch the related babylon delegation
  const babylonDelegation = await fetchBabylonDelegation(bitcoinTransactionId);

  // 3 - set the Adamik transaction state according to the babylon delegation state
  switch (babylonDelegation?.data.state) {
    // No delegation found yet --> pending
    case undefined:
      return TransactionState.PENDING;
      break;
    // Delegation found but not verified yet --> unconfirmed
    case BabylonDelegationState.PENDING:
      return TransactionState.UNCONFIRMED;
      break;
    // All other cases (verified, active, etc) mean the delegation is confirmed
    default:
      return TransactionState.CONFIRMED;
      break;
  }
}

async function getCurrentBabylonStakingParams(): Promise<StakingParams> {
  const babylonStakingParams = await fetchAllBabylonStakingParams();

  const bitcoinLatestBlockHeight = await fetchBitcoinLatestBlockHeight(CURRENT_BABYLON_BITCOIN_CHAIN);

  // Specific logic required to determine what version to use
  // (depends on the current bitcoin block height)
  return getBabylonParamByBtcHeight(bitcoinLatestBlockHeight, babylonStakingParams);
}

async function getBabylonStakingParamsByVersion(version: number): Promise<StakingParams | null> {
  const babylonStakingParams = await fetchAllBabylonStakingParams();

  return babylonStakingParams.find((param) => param.version === version) ?? null;
}

export {
  babylonBlocksToDisplayTime,
  buildBabylonRegistrationMessage,
  buildBabylonStakingPayloads,
  buildSlashingPsbt,
  buildStakingPsbt,
  buildStakingScripts,
  buildUnbondingPsbt,
  buildUnbondingSlashingPsbt,
  buildUnbondingTransaction,
  clearTxSignatures,
  finalizeUnbondingBroadcastPayload,
  getBabylonDelegationState,
  getBabylonStakingParamsByVersion,
  retrieveUnbondingPsbtFromDelegation,
};
