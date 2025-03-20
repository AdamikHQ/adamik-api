import {
  Transaction as AlgoTransaction,
  decodeSignedTransaction,
  encodeMsgpack,
  makeAssetTransferTxnWithSuggestedParamsFromObject,
  makePaymentTxnWithSuggestedParamsFromObject,
} from "algosdk";
import { fetchAccount, fetchTransactionParams } from "~/app/families/algorand/backend/node";
import {
  EncodedTransaction,
  EncodedTransactionFormat,
  EncodedTransactionFormatDetails,
  TransactionData,
  TransactionMode,
  TransactionSpendableAmounts,
} from "~/app/model/types_WIP";
import { AdamikApiServerError, UnsupportedFeatureError } from "~/app/tools/handlers/errors";
import { sha512_256 } from "~/app/tools/hash";

const ALGORAND_MIN_ACCOUNT_BALANCE = 100000;
const ALGORAND_MAX_MEMO_SIZE = 32;

// This is only true for a single signature. If we ever support different type of signatures
// (e.g multi signatures), we will have to add the correct corresponding number of bytes.
const SINGLE_SIGNATURE_SIZE = 71;

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

// FIXME Should also include impact of Algorand smart contracts on minimum balance
// https://developer.algorand.org/docs/get-details/dapps/smart-contracts/apps/#minimum-balance-requirement-for-a-smart-contract
function computeMinimumAlgoBalance(mode: TransactionMode, nbAccountAssets: number): number {
  const base = 100000; // 0.1 ALGO = 100000 mALGO
  const currentAssets = nbAccountAssets;
  //const newAsset = mode === "optIn" ? 1 : 0;
  const newAsset = 0;
  return base * (1 + currentAssets + newAsset);
}

async function isAmountValidForRecipient(recipientAddress: string, amount: bigint): Promise<boolean> {
  const recipientAccount = await fetchAccount(recipientAddress);
  return recipientAccount.balance === 0 ? amount >= ALGORAND_MIN_ACCOUNT_BALANCE : true;
}

const addressHasAsset = async (address: string, assetId: string): Promise<boolean> => {
  const recipientAccount = await fetchAccount(address);
  return recipientAccount.assetAmounts.map((a) => a.assetId).includes(assetId);
};

async function computeMaxSpendable(transaction: TransactionData): Promise<TransactionSpendableAmounts> {
  const { balance, assetAmounts } = await fetchAccount(transaction.senderAddress);

  const maxSpendable = computeAlgoMaxSpendable({
    accountBalance: BigInt(balance),
    nbAccountAssets: assetAmounts.length,
    mode: transaction.mode,
  });

  const algoBalance = maxSpendable > 0 ? maxSpendable : 0n;

  if (transaction.mode === TransactionMode.TRANSFER_TOKEN) {
    const token = assetAmounts.find((assetAmount) => assetAmount.assetId === transaction.tokenId);
    const asaBalance = token?.amount;
    return {
      native: algoBalance,
      token: asaBalance === undefined ? undefined : BigInt(asaBalance),
    };
  } else {
    return { native: algoBalance };
  }
}

async function computeFees(transaction: TransactionData): Promise<bigint> {
  const params = await fetchTransactionParams();

  let suggestedFees = 0;
  if (params.fee) {
    const rawTransaction = await buildRawTransaction({
      ...transaction,
      amount: transaction.amount || 0n,
    });
    const encoded = encodeToSign(rawTransaction);
    const encodedTx = encoded.find((encoded) => encoded.format === EncodedTransactionFormat.ALGORAND_MSGPACK);
    if (!encodedTx) {
      throw new AdamikApiServerError("Missing encoded transaction");
    }
    suggestedFees = Number(params.fee) * (Buffer.from(encodedTx.value, "hex").length + SINGLE_SIGNATURE_SIZE);
  }

  return BigInt(Math.max(suggestedFees, Number(params.minFee)));
}

async function buildRawTransaction(transaction: TransactionData): Promise<AlgoTransaction> {
  const { senderAddress, recipientAddress, amount, mode, memo } = transaction;
  if (amount === undefined) {
    // Should never happen
    throw new AdamikApiServerError("Missing amount is required to build raw transaction");
  }

  const note = memo ? new TextEncoder().encode(memo) : undefined;

  const suggestedParams = await fetchTransactionParams();

  switch (mode) {
    case TransactionMode.TRANSFER: {
      return makePaymentTxnWithSuggestedParamsFromObject({
        sender: senderAddress,
        receiver: recipientAddress,
        amount,
        note,
        suggestedParams,
      });
    }
    case TransactionMode.TRANSFER_TOKEN: {
      return makeAssetTransferTxnWithSuggestedParamsFromObject({
        assetIndex: Number(transaction.tokenId),
        sender: senderAddress,
        receiver: recipientAddress,
        amount,
        note,
        suggestedParams,
      });
    }
    default: {
      throw new UnsupportedFeatureError(`Transaction mode ${mode} is not supported for chainId algorand`);
    }
  }
}

function encodeToSign(payload: AlgoTransaction): EncodedTransaction[] {
  const msgPackEncoded = encodeMsgpack(payload);

  const prefix = Buffer.from("TX");
  const prefixedTx = Buffer.concat([prefix, msgPackEncoded]);

  return [
    {
      format: EncodedTransactionFormat.ALGORAND_MSGPACK,
      value: Buffer.from(msgPackEncoded).toString("hex"),
      details: EncodedTransactionFormatDetails.ALGORAND_MSGPACK,
    },
    {
      format: EncodedTransactionFormat.HASH_SHA512_256,
      value: sha512_256(prefixedTx),
      details: EncodedTransactionFormatDetails.HASH_SHA512_256,
    },
  ];
}

function encodeToBroadcast(payload: AlgoTransaction, signature: Buffer): Buffer {
  const isSignatureEncoded = decodeSignedTransaction(signature);
  if (isSignatureEncoded.sig) {
    return signature;
  } else {
    payload.attachSignature(payload.sender, signature);
    return Buffer.from(encodeMsgpack(payload));
  }
}

export {
  addressHasAsset,
  ALGORAND_MAX_MEMO_SIZE,
  buildRawTransaction,
  computeAlgoMaxSpendable,
  computeFees,
  computeMaxSpendable,
  encodeToBroadcast,
  encodeToSign,
  isAmountValidForRecipient,
};
