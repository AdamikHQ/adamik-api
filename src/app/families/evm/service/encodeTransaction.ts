import {
  BaseError as ViemError,
  encodeFunctionData,
  erc20Abi,
  parseSignature,
  parseTransaction,
  serializeTransaction as serializeL1Transaction,
  Signature,
  toHex,
  TransactionSerializable,
} from "viem";
import { serializeTransaction as serializeL2Transaction } from "viem/op-stack";
import { CHAINS } from "~/app/config/chains";
import {
  ChainId,
  EncodedTransactionFormat,
  Status,
  Transaction,
  TransactionMode,
} from "~/app/model/types_WIP";
import { UnsupportedFeatureError, UserInputError } from "~/app/tools/handlers/errors";
import { estimateFeesPerGas } from "../backend/node";
import { isHexString } from "../logic";
import { EvmService } from "../service";
import { EvmAddress, EvmChainParams } from "../types";

async function encodeTransactionToSign(
  this: EvmService,
  _: {
    transaction: Transaction;
    status: Status;
  }
): Promise<void> {
  const { transaction, status } = _;

  try {
    switch (transaction.data.format) {
      // HEX is the proper format and current default, when format is not explicitely provided
      case undefined:
      case EncodedTransactionFormat.HEX:
        await encodeTransactionAsHex(this.chainId, transaction);
        break;
      // JSON doesn't really make sense, it's only for Metamask and signers that actually do the encoding themselves...
      case EncodedTransactionFormat.JSON:
        await encodeTransactionAsJSON(this.chainId, transaction);
        break;
      default:
        throw new UnsupportedFeatureError(
          `Unsupported encoding format '${transaction.data.format}' for chainId ${this.chainId}`
        );
    }
  } catch (e: any) {
    const message =
      (e instanceof ViemError ? e.shortMessage : e.message) || "Failed to encode the transaction";
    status.errors.push({ message });
  }
}

async function encodeTransactionAsHex(chainId: ChainId, transaction: Transaction): Promise<void> {
  const chain = CHAINS[chainId];
  const chainParams = chain.params as EvmChainParams;

  // amount is safe to cast as it's guaranteed to be filled in by completeTransaction
  const amount = transaction.data.amount as bigint;

  const { maxFeePerGas, maxPriorityFeePerGas } = await estimateFeesPerGas(chainId);

  const data =
    transaction.data.mode === TransactionMode.TRANSFER_TOKEN
      ? encodeFunctionData({
          abi: erc20Abi,
          functionName: "transfer",
          args: [transaction.data.recipientAddress as EvmAddress, amount],
        })
      : undefined;

  const recipient =
    transaction.data.mode === TransactionMode.TRANSFER_TOKEN
      ? (transaction.data.tokenId as EvmAddress)
      : (transaction.data.recipientAddress as EvmAddress);

  const serializeTransactionFn = chainParams?.isL2Fees ? serializeL2Transaction : serializeL1Transaction;

  transaction.encoded = serializeTransactionFn({
    chainId: Number(chain.nativeId),
    maxFeePerGas,
    maxPriorityFeePerGas,
    gas: transaction.data.gas,
    nonce: Number(transaction.data.nonce),
    to: recipient,
    value: transaction.data.mode === TransactionMode.TRANSFER ? amount : 0n,
    data,
  });
}

async function encodeTransactionAsJSON(chainId: ChainId, transaction: Transaction): Promise<void> {
  const chain = CHAINS[chainId];

  const { maxFeePerGas, maxPriorityFeePerGas } = await estimateFeesPerGas(chainId);

  // NOTE These parameters are specific to Metamask-like signers
  // Will need a more precise format than "JSON" if other signers require other parameters
  const commonData = {
    chainId: toHex(Number(chain.nativeId)),
    maxPriorityFeePerGas: toHex(maxPriorityFeePerGas),
    maxFeePerGas: toHex(maxFeePerGas),
    gas: toHex(transaction.data.gas!),
    from: transaction.data.senderAddress,
    nonce: toHex(transaction.data.nonce!),
  };

  switch (transaction.data.mode) {
    case TransactionMode.TRANSFER: {
      transaction.encoded = JSON.stringify({
        ...commonData,
        value: toHex(transaction.data.amount!),
        to: transaction.data.recipientAddress,
      });
      break;
    }
    case TransactionMode.TRANSFER_TOKEN: {
      const data = encodeFunctionData({
        abi: erc20Abi,
        functionName: "transfer",
        args: [transaction.data.recipientAddress as EvmAddress, transaction.data.amount!],
      });

      transaction.encoded = JSON.stringify({
        ...commonData,
        value: toHex(0n),
        to: transaction.data.tokenId,
        data,
      });
      break;
    }
  }
}

async function encodeTransactionToBroadcast(
  this: EvmService,
  _: {
    signedTransaction: Transaction;
    status: Status;
  }
): Promise<string> {
  const { signedTransaction } = _;

  // Useless checks to make the compiler happy, zod already validated the fields
  if (!signedTransaction.signature) {
    throw new UserInputError("Missing transaction signature");
  }
  if (!signedTransaction.encoded) {
    throw new UserInputError("Missing encoded transaction");
  }

  if (!signedTransaction.signature.startsWith("0x")) {
    signedTransaction.signature = `0x${signedTransaction.signature}`;
  }
  // TODO: could be done with zod at route level?
  if (!isHexString(signedTransaction.signature)) {
    throw new UserInputError("Transaction signature must be in valid hex format");
  }

  // TODO Make sure this is documented...
  // NOTE signedTransaction.signature is assumed to be built that way, r,s,v being correct hexadecimal strings:
  //
  // 1) Remove the front "0x" from s and v strings
  // 2) Concatenate them all in a single string : signedTransaction.signature = r + s.slice(2) + v.slice(2)

  const parsedSignature: Signature = (() => {
    try {
      return parseSignature(signedTransaction.signature);
    } catch (e) {
      const parsedSignatureFromTransaction: TransactionSerializable = parseTransaction(
        signedTransaction.signature
      );

      if (parsedSignatureFromTransaction.r === undefined) {
        throw new UserInputError("Invalid signature: missing r parameter");
      }
      if (parsedSignatureFromTransaction.s === undefined) {
        throw new UserInputError("Invalid signature: missing s parameter");
      }
      if (parsedSignatureFromTransaction.v === undefined) {
        throw new UserInputError("Invalid signature: missing v parameter");
      }

      return {
        v: parsedSignatureFromTransaction.v,
        r: parsedSignatureFromTransaction.r,
        s: parsedSignatureFromTransaction.s,
        yParity: parsedSignatureFromTransaction.yParity,
      };
    }
  })();

  const parsedTansaction: TransactionSerializable = isHexString(signedTransaction.encoded)
    ? parseTransaction(signedTransaction.encoded)
    : (JSON.parse(signedTransaction.encoded) as TransactionSerializable);

  const chainParams = CHAINS[this.chainId].params as EvmChainParams;
  const serializeTransactionFn = chainParams?.isL2Fees ? serializeL2Transaction : serializeL1Transaction;

  return serializeTransactionFn(parsedTansaction, parsedSignature);
}

export { encodeTransactionToBroadcast, encodeTransactionToSign };
