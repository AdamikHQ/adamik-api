import {
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
  HashFunction,
  Status,
  Transaction,
  TransactionMode,
} from "~/app/model/types_WIP";
import { UserInputError } from "~/app/tools/handlers/errors";
import { keccak256 } from "~/app/tools/hash";
import { stakewiseVaultDefaultABI } from "../abi/StakewiseVaultDefaultABI";
import { estimateFeesPerGas } from "../backend/node";
import { getHarvestParams } from "../backend/stakewise";
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

  const rawTransaction = await encodeTransactionAsRLP(this.chainId, transaction);

  transaction.encoded = [
    {
      raw: {
        format: EncodedTransactionFormat.RLP,
        value: rawTransaction,
      },
      hash: {
        format: HashFunction.KECCAK256,
        value: keccak256(Buffer.from(rawTransaction.slice(2), "hex")),
      },
    },
    {
      raw: {
        format: EncodedTransactionFormat.WALLET_CONNECT,
        value: await encodeTransactionAsWalletConnect(this.chainId, transaction),
      },
    },
  ];
}

type DeepHexPrefixedValues<T> = {
  [K in keyof T]: T[K] extends string // Check if it's any string type (literal or general)
    ? T[K] extends `${infer R}` // This condition is true for all strings, R captures the content
      ? `0x${R}` // Applies 0x prefix to any string content
      : never // Should not happen for strings
    : T[K] extends object // If not a string, check if it's an object
    ? DeepHexPrefixedValues<T[K]> // Recurse for objects
    : T[K]; // If not string and not object, keep its original type (e.g., number, boolean, null, undefined)
};

async function encodeTransactionAsRLP(chainId: ChainId, transaction: Transaction): Promise<string> {
  const chain = CHAINS[chainId];
  const chainParams = chain.params as EvmChainParams;

  // amount is safe to cast as it's guaranteed to be filled in by completeTransaction
  const amount = transaction.data.amount as bigint;

  const { maxFeePerGas, maxPriorityFeePerGas } = await estimateFeesPerGas(chainId);

  let data: `0x${string}` | undefined;
  let recipient: EvmAddress;
  switch (transaction.data.mode) {
    case TransactionMode.TRANSFER_TOKEN:
      data = encodeFunctionData({
        abi: erc20Abi,
        functionName: "transfer",
        args: [transaction.data.recipientAddress as EvmAddress, amount],
      });
      recipient = transaction.data.tokenId as EvmAddress;
      break;
    case TransactionMode.STAKE:
      const harvestParams = await getHarvestParams(chainId, transaction.data.targetValidatorAddress);

      if (harvestParams.canHarvest) {
        data = encodeFunctionData({
          abi: stakewiseVaultDefaultABI,
          functionName: "updateStateAndDeposit",
          args: [
            transaction.data.senderAddress as EvmAddress,
            transaction.data.targetValidatorAddress as EvmAddress,
            harvestParams.params as DeepHexPrefixedValues<typeof harvestParams.params>,
          ],
        });
      } else {
        data = encodeFunctionData({
          abi: stakewiseVaultDefaultABI,
          functionName: "deposit",
          args: [
            transaction.data.senderAddress as EvmAddress,
            transaction.data.targetValidatorAddress as EvmAddress,
          ],
        });
      }
      recipient = transaction.data.targetValidatorAddress as EvmAddress;
      break;
    default:
      recipient = transaction.data.recipientAddress as EvmAddress;
      break;
  }

  const serializeTransactionFn = chainParams?.isL2Fees ? serializeL2Transaction : serializeL1Transaction;

  return serializeTransactionFn({
    chainId: Number(chain.nativeId),
    maxFeePerGas,
    maxPriorityFeePerGas,
    gas: transaction.data.gas,
    nonce: Number(transaction.data.nonce),
    to: recipient,
    value: transaction.data.mode === TransactionMode.TRANSFER_TOKEN ? 0n : amount,
    data,
  });
}

async function encodeTransactionAsWalletConnect(chainId: ChainId, transaction: Transaction): Promise<string> {
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
      return JSON.stringify({
        ...commonData,
        value: toHex(transaction.data.amount!),
        to: transaction.data.recipientAddress,
      });
    }

    case TransactionMode.TRANSFER_TOKEN: {
      const data = encodeFunctionData({
        abi: erc20Abi,
        functionName: "transfer",
        args: [transaction.data.recipientAddress as EvmAddress, transaction.data.amount!],
      });

      return JSON.stringify({
        ...commonData,
        value: toHex(0n),
        to: transaction.data.tokenId,
        data,
      });
    }

    case TransactionMode.STAKE: {
      const harvestParams = await getHarvestParams(chainId, transaction.data.targetValidatorAddress);

      let data: `0x${string}` | undefined;
      if (harvestParams.canHarvest) {
        data = encodeFunctionData({
          abi: stakewiseVaultDefaultABI,
          functionName: "updateStateAndDeposit",
          args: [
            transaction.data.senderAddress as EvmAddress,
            transaction.data.targetValidatorAddress as EvmAddress,
            harvestParams.params as DeepHexPrefixedValues<typeof harvestParams.params>,
          ],
        });
      } else {
        data = encodeFunctionData({
          abi: stakewiseVaultDefaultABI,
          functionName: "deposit",
          args: [
            transaction.data.senderAddress as EvmAddress,
            transaction.data.targetValidatorAddress as EvmAddress,
          ],
        });
      }

      return JSON.stringify({
        ...commonData,
        value: toHex(transaction.data.amount!),
        to: transaction.data.targetValidatorAddress,
        data,
      });
    }
  }

  throw new UserInputError("Invalid transaction mode");
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

  const rawTransaction = signedTransaction.encoded.find((encoded) => {
    return encoded.raw?.format === EncodedTransactionFormat.RLP;
  });

  if (!rawTransaction) {
    throw new UserInputError("Missing encoded transaction in RLP format");
  }

  const parsedTansaction: TransactionSerializable = parseTransaction(
    rawTransaction.raw!.value as `0x${string}`
  );

  const chainParams = CHAINS[this.chainId].params as EvmChainParams;
  const serializeTransactionFn = chainParams?.isL2Fees ? serializeL2Transaction : serializeL1Transaction;

  return serializeTransactionFn(parsedTansaction, parsedSignature);
}

export { encodeTransactionToBroadcast, encodeTransactionToSign };
