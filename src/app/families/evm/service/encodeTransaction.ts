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

async function encodeTransactionToSign(this: EvmService, transaction: Transaction): Promise<void> {
  try {
    switch (transaction.plain.format) {
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
          `Unsupported encoding format '${transaction.plain.format}' for chain ID ${transaction.plain.chainId}`
        );
    }
  } catch (e: any) {
    const message =
      (e instanceof ViemError ? e.shortMessage : e.message) || "Failed to encode the transaction";
    transaction.status.errors.push({ message });
  }
}

async function encodeTransactionToSignAsJSON(chainId: ChainId, transaction: Transaction) {
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
    default:
      throw new Error(
        `Unsupported transaction mode ${transaction.plain.mode} for chain ID ${transaction.plain.chainId}`
      );
  }
}

async function encodeTransactionToSignAsHex(chainId: ChainId, transaction: Transaction) {
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
    const signature: Signature = parseSignature(signedTransaction.signature as `0x${string}`);

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
