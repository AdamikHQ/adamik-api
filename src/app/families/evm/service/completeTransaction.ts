import { ChainId, CompleteTransaction, Transaction, TransactionMode } from "~/app/model/types_WIP";
import { getTransactionFees, getTransactionAmount, getTransactionGas } from "../logic";
import { EvmService } from ".";
import { BaseError as ViemError } from "viem";
import { getNonce } from "../backend/node";
import { EvmAddress } from "../types";
import { address } from "bitcoinjs-lib";

async function completeTransaction(this: EvmService, transaction: Transaction): Promise<CompleteTransaction> {
  try {
    const nonce = await getNonce(this.chainId, transaction.data.sender as EvmAddress);
    transaction.data.nonce = BigInt(nonce);

    let completeTransactionData: CompleteTransaction["data"];
    switch (transaction.data.mode) {
      case TransactionMode.TRANSFER:
        completeTransactionData = await completeNativeTransaction(this.chainId, transaction.data);
        break;
      case TransactionMode.TRANSFER_TOKEN:
        completeTransactionData = await completeTokenTransaction(this.chainId, transaction.data);
        break;
      default:
        // should never happen, zod already validated the mode per chain
        throw new Error(
          `Unsupported transaction mode ${transaction.data.mode} for EVM chain ${this.chainId}`
        );
    }
    return {
      ...transaction,
      data: completeTransactionData,
    };
  } catch (e: any) {
    const message =
      (e instanceof ViemError ? e.shortMessage : e.message) || "Failed to complete the transaction";
    transaction.status.errors.push({ message });
    return transaction as CompleteTransaction;
  }
}

async function completeNativeTransaction(
  chainId: ChainId,
  transaction: Transaction["data"]
): Promise<CompleteTransaction["data"]> {
  // Since a gas estimation is done by simulating the transaction,
  // we can't know in advance how much we should put in the simulation.
  // But as a native transaction (no smart contract) should always consume the same amount of gas,
  // no matter the amount of coin transfered, we can infer the gas with any amount
  let gas = await getTransactionGas(chainId, transaction);
  let fees = await getTransactionFees(chainId, transaction);
  let amount = await getTransactionAmount(chainId, transaction);

  return {
    ...transaction,
    gas,
    fees,
    recipients: [
      {
        ...transaction.recipients[0],
        amount,
      },
    ],
  };
}

async function completeTokenTransaction(
  chainId: ChainId,
  transaction: Transaction["data"]
): Promise<CompleteTransaction["data"]> {
  let amount = await getTransactionAmount(chainId, transaction);
  let gas = await getTransactionGas(chainId, transaction);
  let fees = await getTransactionFees(chainId, transaction);

  return {
    ...transaction,
    gas,
    fees,
    recipients: [
      {
        ...transaction.recipients[0],
        amount,
      },
    ],
  };
}

export { completeTransaction };
