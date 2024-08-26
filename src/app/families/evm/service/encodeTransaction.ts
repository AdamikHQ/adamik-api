import {
  encodeFunctionData,
  parseSignature,
  serializeTransaction as serializeL1Transaction,
  erc20Abi,
  toHex,
  BaseError as ViemError,
  Signature,
  parseTransaction,
  TransactionSerializable,
  TransactionSerialized,
} from "viem";
import { serializeTransaction as serializeL2Transaction } from "viem/op-stack";
import { Transaction, TransactionMode, EncodedTransactionFormat, ChainId } from "~/app/model/types_WIP";
import { estimateFeesPerGas } from "../backend/node";
import { EvmService } from ".";
import { EvmAddress, EvmChainParams } from "../types";
import { CHAINS } from "~/app/config/chains";
import { isHexString } from "../logic";

async function encodeTransactionToSign(this: EvmService, transaction: Transaction): Promise<void> {
  try {
    switch (transaction.plain.format) {
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
        throw new Error(
          `Unsupported encoding format '${transaction.plain.format}' for chain ID ${transaction.plain.chainId}`
        );
    }
  } catch (e: any) {
    const message =
      (e instanceof ViemError ? e.shortMessage : e.message) || "Failed to encode the transaction";
    transaction.status.errors.push({ message });
  }
}

async function encodeTransactionAsHex(chainId: ChainId, transaction: Transaction): Promise<void> {
  const chain = CHAINS[chainId];
  const chainParams = chain.params as EvmChainParams;

  const { maxFeePerGas, maxPriorityFeePerGas } = await estimateFeesPerGas(chainId);

  const data =
    transaction.plain.mode === TransactionMode.TRANSFER_TOKEN
      ? encodeFunctionData({
          abi: erc20Abi,
          functionName: "transfer",
          args: [transaction.plain.recipients[0] as EvmAddress, transaction.plain.amount],
        })
      : undefined;

  const recipient =
    transaction.plain.mode === TransactionMode.TRANSFER_TOKEN
      ? (transaction.plain.tokenId as EvmAddress)
      : (transaction.plain.recipients[0] as EvmAddress);

  const serializeTransactionFn = chainParams?.isL2Fees ? serializeL2Transaction : serializeL1Transaction;

  transaction.encoded = serializeTransactionFn({
    chainId: Number(chain.nativeId),
    maxFeePerGas,
    maxPriorityFeePerGas,
    gas: transaction.plain.gas,
    nonce: Number(transaction.plain.nonce),
    to: recipient,
    value: transaction.plain.amount,
    data,
  }) as TransactionSerialized;
}

async function encodeTransactionAsJSON(chainId: ChainId, transaction: Transaction): Promise<void> {
  const { maxFeePerGas, maxPriorityFeePerGas } = await estimateFeesPerGas(chainId);

  switch (transaction.plain.mode) {
    case TransactionMode.TRANSFER: {
      // NOTE These parameters are specific to Metamask-like signers
      // Will need a more precise format than "JSON" if other signers require other parameters
      transaction.encoded = {
        maxPriorityFeePerGas: toHex(maxPriorityFeePerGas as bigint),
        maxFeePerGas: toHex(maxFeePerGas as bigint),
        value: toHex(transaction.plain.amount),
        from: transaction.plain.senders[0],
        to: transaction.plain.recipients[0],
      } as any;
      break;
    }
    case TransactionMode.TRANSFER_TOKEN: {
      const data = encodeFunctionData({
        abi: erc20Abi,
        functionName: "transfer",
        args: [transaction.plain.recipients[0] as EvmAddress, transaction.plain.amount],
      });

      transaction.encoded = {
        maxPriorityFeePerGas: toHex(maxPriorityFeePerGas as bigint),
        maxFeePerGas: toHex(maxFeePerGas as bigint),
        from: transaction.plain.senders[0],
        to: transaction.plain.tokenId,
        data,
      } as any;
      break;
    }
  }
}

async function encodeTransactionToBroadcast(
  this: EvmService,
  signedTransaction: Transaction
): Promise<string> {
  try {
    // TODO Could be done with zod at route level
    if (!signedTransaction.signature) {
      throw new Error("Missing transaction signature");
    } else if (!isHexString(signedTransaction.signature)) {
      throw new Error("Transaction signature must be in valid hex format");
    }

    // TODO Could be done with zod at route level
    if (!signedTransaction.encoded) {
      throw new Error("Missing encoded transaction");
    } else if (!isHexString(signedTransaction.encoded)) {
      throw new Error("Encoded transaction must be in valid hex format");
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
          throw new Error("Invalid signature: missing r parameter");
        }
        if (parsedSignatureFromTransaction.s === undefined) {
          throw new Error("Invalid signature: missing s parameter");
        }
        if (parsedSignatureFromTransaction.v === undefined) {
          throw new Error("Invalid signature: missing v parameter");
        }

        return {
          v: parsedSignatureFromTransaction.v,
          r: parsedSignatureFromTransaction.r,
          s: parsedSignatureFromTransaction.s,
          yParity: parsedSignatureFromTransaction.yParity,
        };
      }
    })();

    const parsedTansaction: TransactionSerializable = parseTransaction(
      signedTransaction.encoded as TransactionSerialized
    );

    const chainParams = CHAINS[this.chainId].params as EvmChainParams;
    const serializeTransactionFn = chainParams?.isL2Fees ? serializeL2Transaction : serializeL1Transaction;

    return serializeTransactionFn(parsedTansaction, parsedSignature);
  } catch (e: any) {
    signedTransaction.status.errors.push({ message: `Error while encoding to broadcast: ${e.message}` });
    return "";
  }
}

export { encodeTransactionToSign, encodeTransactionToBroadcast };
