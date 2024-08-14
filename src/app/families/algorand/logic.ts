import nacl from "tweetnacl";
import base32 from "hi-base32";
import sha512 from "js-sha512";
import { encode as msgpackEncode } from "algo-msgpack-with-bigint";
import {
  EncodedSignedTransaction as AlgoEncodedSignedTransaction,
  Transaction as AlgoTransaction,
  EncodedTransaction as AlgoEncodedTransaction,
  makePaymentTxnWithSuggestedParams,
  makeAssetTransferTxnWithSuggestedParams,
  decodeSignedTransaction,
} from "algosdk";
import { PlainTransaction, TransactionMode, TransactionSpendableAmounts } from "~/app/model/types_WIP";
import { fetchAccount, fetchTransactionParams } from "~/app/families/algorand/backend/node";

// TODO Keep this file as a fourre-tout or split it?

// FIXME Do we really need nacl just for this?
const PUBLIC_KEY_LENGTH = nacl.sign.publicKeyLength;
const ALGORAND_ADDRESS_LENGTH = 58;
const ALGORAND_CHECKSUM_BYTE_LENGTH = 4;
const ALGORAND_MIN_ACCOUNT_BALANCE = 100000;
const ALGORAND_MAX_MEMO_SIZE = 32;

// This is only true for a single signature. If we ever support different type of signatures
// (e.g multi signatures), we will have to add the correct corresponding number of bytes.
const SINGLE_SIGNATURE_SIZE = 71;

function encodeAddress(address: Uint8Array): string {
  const checksum = sha512.sha512_256
    .array(address)
    .slice(PUBLIC_KEY_LENGTH - ALGORAND_CHECKSUM_BYTE_LENGTH, PUBLIC_KEY_LENGTH);
  const addr = base32.encode(concatArrays(address, checksum));

  return addr.toString().slice(0, ALGORAND_ADDRESS_LENGTH);
}

function concatArrays(...arrs: ArrayLike<number>[]): Uint8Array {
  const size = arrs.reduce((sum, arr) => sum + arr.length, 0);
  const c = new Uint8Array(size);

  let offset = 0;
  for (let i = 0; i < arrs.length; i++) {
    c.set(arrs[i], offset);
    offset += arrs[i].length;
  }

  return c;
}

function computeAlgoMaxSpendable({
  accountBalance,
  nbAccountAssets,
  mode,
}: {
  accountBalance: bigint;
  nbAccountAssets: number;
  mode: TransactionMode;
}): bigint {
  const minBalance = computeMinimumAlgoBalance(mode, nbAccountAssets);
  const maxSpendable = accountBalance - BigInt(minBalance);
  return maxSpendable >= 0 ? maxSpendable : 0n;
}

function computeMinimumAlgoBalance(mode: TransactionMode, nbAccountAssets: number): number {
  const base = 100000; // 0.1 ALGO = 100000 mALGO
  const currentAssets = nbAccountAssets;
  //const newAsset = mode === "optIn" ? 1 : 0;
  const newAsset = 0;
  return base * (1 + currentAssets + newAsset);
}

async function isAmountValidForRecipient(recipientAddress: string, amount: bigint): Promise<boolean> {
  const recipientAccount = await fetchAccount(recipientAddress);
  return recipientAccount.balance === 0n ? amount >= ALGORAND_MIN_ACCOUNT_BALANCE : true;
}

const addressHasAsset = async (address: string, assetId: string): Promise<boolean> => {
  const recipientAccount = await fetchAccount(address);
  return recipientAccount.assetAmounts.map((a) => a.assetId).includes(assetId);
};

async function computeMaxSpendable(transaction: PlainTransaction): Promise<TransactionSpendableAmounts> {
  const { balance, assetAmounts } = await fetchAccount(transaction.senders[0]);

  const maxSpendable = computeAlgoMaxSpendable({
    accountBalance: balance,
    nbAccountAssets: assetAmounts.length,
    mode: transaction.mode,
  });

  const algoBalance = maxSpendable > 0 ? maxSpendable : 0n;

  if (transaction.mode === TransactionMode.TRANSFER_TOKEN) {
    const token = assetAmounts.find((assetAmount) => assetAmount.assetId === transaction.tokenId);
    const asaBalance = token?.amount;
    return {
      native: algoBalance,
      token: asaBalance,
    };
  } else {
    return { native: algoBalance };
  }
}

async function computeFees(transaction: PlainTransaction): Promise<bigint> {
  const params = await fetchTransactionParams();

  let suggestedFees = 0;
  if (params.fee) {
    const rawTransaction = await buildRawTransaction(transaction);
    const encoded = encodeToSign(rawTransaction);
    suggestedFees = params.fee * (Buffer.from(encoded, "hex").length + SINGLE_SIGNATURE_SIZE);
  }

  return BigInt(Math.max(suggestedFees, params.minFee));
}

async function buildRawTransaction(transaction: PlainTransaction): Promise<AlgoEncodedTransaction> {
  const { amount, senders, recipients, mode, memo } = transaction;

  const note = memo ? new TextEncoder().encode(memo) : undefined;

  const params = await fetchTransactionParams();

  const assetId = mode === TransactionMode.TRANSFER_TOKEN && transaction.tokenId;

  const algoTxn: AlgoTransaction = !assetId
    ? makePaymentTxnWithSuggestedParams(senders[0], recipients[0], amount, undefined, note, params)
    : makeAssetTransferTxnWithSuggestedParams(
        senders[0],
        recipients[0],
        undefined,
        undefined,
        amount,
        note,
        Number(assetId),
        params,
        undefined
      );

  // Bit of safety: set tx validity to the next 1000 blocks
  algoTxn.firstRound = params.lastRound;
  algoTxn.lastRound = params.lastRound + 1000;

  // Flaw in the SDK: payload isn't sorted, but it needs to be for msgPack encoding
  const sorted = Object.fromEntries(
    Object.entries(algoTxn.get_obj_for_encoding()).sort()
  ) as AlgoEncodedTransaction;

  return sorted;
}

function encodeToSign(payload: AlgoEncodedTransaction): string {
  const msgPackEncoded = msgpackEncode(payload);

  return Buffer.from(msgPackEncoded).toString("hex");
}

function encodeToBroadcast(payload: AlgoEncodedTransaction, signature: Buffer): Buffer {
  const isSignatureEncoded = decodeSignedTransaction(signature);
  if (isSignatureEncoded.sig) {
    return Buffer.from(signature);
  } else {
    const signedPayload: AlgoEncodedSignedTransaction = {
      sig: signature,
      txn: payload,
    };
    const msgPackEncoded = msgpackEncode(signedPayload);

    return Buffer.from(msgPackEncoded);
  }
}

export {
  ALGORAND_MAX_MEMO_SIZE,
  encodeAddress,
  isAmountValidForRecipient,
  addressHasAsset,
  computeMaxSpendable,
  computeFees,
  buildRawTransaction,
  encodeToSign,
  encodeToBroadcast,
};
