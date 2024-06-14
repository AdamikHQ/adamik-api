import { ChainId, PlainTransaction, Transaction, TransactionMode } from "~/app/model/types_WIP";
import { getTransactionFees, getTransactionAmount, getTransactionGas } from "../logic";
import { EvmService } from ".";
import { BaseError as ViemError } from "viem";
import { getNonce } from "../backend/node";
import { EvmAddress } from "../types";

async function completeTransaction(this: EvmService, transaction: Transaction): Promise<void> {
  try {
    transaction.plain.nonce = await getNonce(this.chainId, transaction.plain.senders[0] as EvmAddress);

    switch (transaction.plain.mode) {
      case TransactionMode.TRANSFER:
        await completeNativeTransaction(this.chainId, transaction.plain);
        break;
      case TransactionMode.TRANSFER_TOKEN:
        await completeTokenTransaction(this.chainId, transaction.plain);
        break;
      default:
        throw new Error(
          `Unsupported transaction mode ${transaction.plain.mode} for chain ID ${transaction.plain.chainId}`
        );
    }
  } catch (e: any) {
    const message =
      (e instanceof ViemError ? e.shortMessage : e.message) || "Failed to complete the transaction";
    transaction.status.errors.push({ message });
  }
}

async function completeNativeTransaction(chainId: ChainId, transaction: PlainTransaction): Promise<void> {
  // Since a gas estimation is done by simulating the transaction,
  // we can't know in advance how much we should put in the simulation.
  // But as a native transaction (no smart contract) should always consume the same amount of gas,
  // no matter the amount of coin transfered, we can infer the gas with any amount
  transaction.gas = await getTransactionGas(chainId, transaction);

  transaction.fees = await getTransactionFees(chainId, transaction);

  transaction.amount = await getTransactionAmount(chainId, transaction);
}

async function completeTokenTransaction(chainId: ChainId, transaction: PlainTransaction): Promise<void> {
  transaction.amount = await getTransactionAmount(chainId, transaction);

  transaction.gas = await getTransactionGas(chainId, transaction);

  transaction.fees = await getTransactionFees(chainId, transaction);
}

export { completeTransaction };
