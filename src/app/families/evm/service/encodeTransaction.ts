import {
  encodeFunctionData,
  erc20Abi,
  parseSignature,
  parseTransaction,
  serializeTransaction as serializeL1Transaction,
  Signature,
  toHex,
  TransactionSerializable,
  TransactionSerialized,
  BaseError as ViemError,
} from "viem";
import { serializeTransaction as serializeL2Transaction } from "viem/op-stack";
import { CHAINS } from "~/app/config/chains";
import {
  ChainId,
  CompleteTransaction,
  EncodedTransactionFormat,
  Transaction,
  TransactionMode,
} from "~/app/model/types_WIP";
import { EvmService } from ".";
import { estimateFeesPerGas } from "../backend/node";
import { EvmAddress, EvmChainParams } from "../types";

async function encodeTransactionToSign(this: EvmService, transaction: CompleteTransaction): Promise<void> {
  try {
    switch (transaction.data.format) {
      // HEX is the proper format and current default, when format is not explicitely provided
      case undefined:
      case EncodedTransactionFormat.HEX:
        await encodeTransactionToSignAsHex(this.chainId, transaction);
        break;
      // JSON doesn't really make sense, it's only for Metamask and signers that actually do the encoding themselves...
      case EncodedTransactionFormat.JSON:
        await encodeTransactionToSignAsJSON(this.chainId, transaction);
        break;
      default:
        throw new Error(
          `Unsupported encoding format '${transaction.data.format}' for chain ID ${transaction.data.chainId}`
        );
    }
  } catch (e: any) {
    const message =
      (e instanceof ViemError ? e.shortMessage : e.message) || "Failed to encode the transaction";
    transaction.status.errors.push({ message });
  }
}

async function encodeTransactionToSignAsJSON(chainId: ChainId, transaction: CompleteTransaction) {
  const { maxFeePerGas, maxPriorityFeePerGas } = await estimateFeesPerGas(chainId);

  switch (transaction.data.mode) {
    case TransactionMode.TRANSFER: {
      // NOTE These parameters are specific to Metamask-like signers
      // Will need a more precise format than "JSON" if other signers require other parameters
      transaction.encoded = {
        maxPriorityFeePerGas: toHex(maxPriorityFeePerGas as bigint),
        maxFeePerGas: toHex(maxFeePerGas as bigint),
        value: toHex(transaction.data.recipients[0].amount),
        from: transaction.data.sender,
        to: transaction.data.recipients[0],
      } as any;
      break;
    }
    case TransactionMode.TRANSFER_TOKEN: {
      const data = encodeFunctionData({
        abi: erc20Abi,
        functionName: "transfer",
        args: [transaction.data.recipients[0].address as EvmAddress, transaction.data.recipients[0].amount],
      });

      transaction.encoded = {
        maxPriorityFeePerGas: toHex(maxPriorityFeePerGas as bigint),
        maxFeePerGas: toHex(maxFeePerGas as bigint),
        from: transaction.data.sender,
        to: transaction.data.tokenId,
        data,
      } as any;
      break;
    }
  }
}

async function encodeTransactionToSignAsHex(chainId: ChainId, transaction: CompleteTransaction) {
  const chain = CHAINS[chainId];
  const chainParams = chain.params as EvmChainParams;

  const { maxFeePerGas, maxPriorityFeePerGas } = await estimateFeesPerGas(chainId);

  const data =
    transaction.data.mode === TransactionMode.TRANSFER_TOKEN
      ? encodeFunctionData({
          abi: erc20Abi,
          functionName: "transfer",
          args: [transaction.data.recipients[0].address as EvmAddress, transaction.data.recipients[0].amount],
        })
      : undefined;

  const recipient =
    transaction.data.mode === TransactionMode.TRANSFER_TOKEN
      ? (transaction.data.tokenId as EvmAddress)
      : (transaction.data.recipients[0].address as EvmAddress);

  const serializeTransactionFn = chainParams?.isL2Fees ? serializeL2Transaction : serializeL1Transaction;

  transaction.encoded = serializeTransactionFn({
    chainId: Number(chain.nativeId),
    maxFeePerGas,
    maxPriorityFeePerGas,
    gas: transaction.data.gas,
    nonce: Number(transaction.data.nonce),
    to: recipient,
    value: transaction.data.recipients[0].amount,
    data,
  }) as TransactionSerialized;
}

// FIXME Untestable at the moment since all supported EVM signers want to do the broadcast themselves
async function encodeTransactionToBroadcast(
  this: EvmService,
  signedTransaction: Transaction
): Promise<string> {
  try {
    if (!signedTransaction.encoded) {
      throw new Error("missing encoded transaction");
    }
    if (!signedTransaction.signature) {
      throw new Error("missing transaction signature");
    }

    // TODO Make sure this is documented...
    // NOTE signedTransaction.signature is assumed to be built that way, r,s,v being correct hexadecimal strings:
    //
    // 1) Remove the front "0x" from s and v strings
    // 2) Concatenate them all in a single string
    // signedTransaction.signature = r + s.slice(2) + v.slice(2)
    const signature: Signature = parseSignature(
      ((!signedTransaction.signature.startsWith("0x") ? "0x" : "") +
        signedTransaction.signature) as `0x${string}`
    );

    const transaction: TransactionSerializable = parseTransaction(
      signedTransaction.encoded as TransactionSerialized
    );

    const chainParams = CHAINS[this.chainId].params as EvmChainParams;
    const serializeTransactionFn = chainParams?.isL2Fees ? serializeL2Transaction : serializeL1Transaction;

    return serializeTransactionFn(transaction, signature);
  } catch (e: any) {
    signedTransaction.status.errors.push({ message: `Error while encoding to broadcast: ${e.message}` });
    return "";
  }
}

export { encodeTransactionToBroadcast, encodeTransactionToSign };
