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
import {
  buildStakewiseUnstakeData,
  buildStakewiseWithdrawData,
  encodeStakewiseStakeData,
  isHexString,
} from "../logic";
import { EvmService } from "../service";
import { EvmAddress, EvmChainParams, HexString } from "../types";

// FIXME encoded value is always built twice,
// once by encodeTransactionAsRLP and once by encodeTransactionAsWalletConnect
// It should only be built once and used by both
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

  delete transaction.data.params; // No need to expose it for EVM chains, at the moment
}

async function encodeTransactionAsRLP(chainId: ChainId, transaction: Transaction): Promise<string> {
  const chain = CHAINS[chainId];
  const chainParams = chain.params as EvmChainParams;

  // amount is safe to cast as it's guaranteed to be filled in by completeTransaction
  const amount = transaction.data.amount as bigint;

  const { maxFeePerGas, maxPriorityFeePerGas } = await estimateFeesPerGas(chainId);

  const { data, value, recipient } = await (async (): Promise<{
    recipient: EvmAddress;
    value?: bigint;
    data?: HexString;
  }> => {
    switch (transaction.data.mode) {
      case TransactionMode.TRANSFER: {
        const recipient = transaction.data.recipientAddress as EvmAddress;
        return { recipient, value: amount };
      }

      case TransactionMode.TRANSFER_TOKEN: {
        const data = encodeFunctionData({
          abi: erc20Abi,
          functionName: "transfer",
          args: [transaction.data.recipientAddress as EvmAddress, amount],
        });
        const recipient = transaction.data.tokenId as EvmAddress;
        return { recipient, data };
      }

      case TransactionMode.STAKE: {
        const data = await encodeStakewiseStakeData(chainId, transaction.data);
        const recipient = transaction.data.targetValidatorAddress as EvmAddress;
        return { recipient, data, value: amount };
      }

      case TransactionMode.UNSTAKE: {
        const args = await buildStakewiseUnstakeData(chainId, transaction.data);
        const data = encodeFunctionData({
          abi: stakewiseVaultDefaultABI,
          functionName: "enterExitQueue",
          args,
        });
        const recipient = transaction.data.validatorAddress as EvmAddress;
        return { recipient, data };
      }

      case TransactionMode.WITHDRAW: {
        const args = await buildStakewiseWithdrawData(chainId, transaction.data);
        const data = encodeFunctionData({
          abi: stakewiseVaultDefaultABI,
          functionName: "claimExitedAssets",
          args,
        });
        const recipient = transaction.data.validatorAddress as EvmAddress;
        return { recipient, data };
      }

      default: {
        throw new UserInputError("Invalid transaction mode");
      }
    }
  })();

  const serializeTransactionFn = chainParams?.isL2Fees ? serializeL2Transaction : serializeL1Transaction;

  return serializeTransactionFn({
    chainId: Number(chain.nativeId),
    maxFeePerGas,
    maxPriorityFeePerGas,
    gas: transaction.data.gas,
    nonce: Number(transaction.data.nonce),
    to: recipient,
    value,
    data,
  });
}

async function encodeTransactionAsWalletConnect(chainId: ChainId, transaction: Transaction): Promise<string> {
  const chain = CHAINS[chainId];

  const { maxFeePerGas, maxPriorityFeePerGas } = await estimateFeesPerGas(chainId);

  // NOTE These parameters are specific to Metamask-like signers
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
      const data = await encodeStakewiseStakeData(chainId, transaction.data);

      return JSON.stringify({
        ...commonData,
        value: toHex(transaction.data.amount!),
        to: transaction.data.targetValidatorAddress,
        data,
      });
    }

    case TransactionMode.UNSTAKE: {
      const args = await buildStakewiseUnstakeData(chainId, transaction.data);
      const data = encodeFunctionData({
        abi: stakewiseVaultDefaultABI,
        functionName: "enterExitQueue",
        args,
      });

      return JSON.stringify({
        ...commonData,
        to: transaction.data.validatorAddress,
        data,
      });
    }

    case TransactionMode.WITHDRAW: {
      const args = await buildStakewiseWithdrawData(chainId, transaction.data);
      const data = encodeFunctionData({
        abi: stakewiseVaultDefaultABI,
        functionName: "claimExitedAssets",
        args,
      });

      return JSON.stringify({
        ...commonData,
        to: transaction.data.validatorAddress,
        data,
      });
    }

    default: {
      throw new UserInputError("Invalid transaction mode");
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

  const rawTransaction = signedTransaction.encoded.find((encoded) => {
    return encoded.raw?.format === EncodedTransactionFormat.RLP;
  });

  if (!rawTransaction) {
    throw new UserInputError("Missing encoded transaction in RLP format");
  }

  const parsedTansaction: TransactionSerializable = parseTransaction(rawTransaction.raw!.value as HexString);

  const chainParams = CHAINS[this.chainId].params as EvmChainParams;
  const serializeTransactionFn = chainParams?.isL2Fees ? serializeL2Transaction : serializeL1Transaction;

  return serializeTransactionFn(parsedTansaction, parsedSignature);
}

export { encodeTransactionToBroadcast, encodeTransactionToSign };
