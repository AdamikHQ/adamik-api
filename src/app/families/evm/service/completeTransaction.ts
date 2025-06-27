import { BaseError as ViemError } from "viem";
import {
  ChainId,
  StakeTransactionData,
  Status,
  Transaction,
  TransactionData,
  TransactionMode,
} from "~/app/model/types_WIP";
import { UnsupportedFeatureError } from "~/app/tools/handlers/errors";
import { fetchNonce } from "../backend/node";
import { getTransactionAmount, getTransactionFees, getTransactionGas } from "../logic";
import { EvmService } from "../service";
import { EvmAddress } from "../types";

async function completeTransaction(
  this: EvmService,
  _: {
    transaction: Transaction;
    status: Status;
  }
): Promise<void> {
  const { transaction, status } = _;

  try {
    const nonce = await fetchNonce(this.chainId, transaction.data.senderAddress as EvmAddress);
    transaction.data.nonce = BigInt(nonce);

    switch (transaction.data.mode) {
      case TransactionMode.TRANSFER:
        await completeNativeTransaction(this.chainId, transaction.data);
        break;
      case TransactionMode.TRANSFER_TOKEN:
        await completeTokenTransaction(this.chainId, transaction.data);
        break;
      case TransactionMode.STAKE:
        await completeStakeTransaction(this.chainId, transaction.data);
        break;
      default:
        // should never happen, zod already validated the mode per chain
        throw new UnsupportedFeatureError(
          `Unsupported transaction mode ${transaction.data.mode} for chain ${this.chainId}`
        );
    }
  } catch (e: any) {
    const message =
      (e instanceof ViemError ? e.shortMessage : e.message) || "Failed to complete the transaction";
    status.errors.push({ message });
  }
}

async function completeNativeTransaction(chainId: ChainId, transaction: TransactionData): Promise<void> {
  // Since a gas estimation is done by simulating the transaction,
  // we can't know in advance how much we should put in the simulation.
  // But as a native transaction (no smart contract) should always consume the same amount of gas,
  // no matter the amount of coin transfered, we can infer the gas with any amount
  transaction.gas = await getTransactionGas(chainId, transaction);
  transaction.fees = await getTransactionFees(chainId, transaction);
  transaction.amount = await getTransactionAmount(chainId, transaction);
}

async function completeTokenTransaction(chainId: ChainId, transaction: TransactionData): Promise<void> {
  transaction.amount = await getTransactionAmount(chainId, transaction);
  transaction.gas = await getTransactionGas(chainId, transaction);
  transaction.fees = await getTransactionFees(chainId, transaction);
}

async function completeStakeTransaction(chainId: ChainId, transaction: StakeTransactionData): Promise<void> {
  transaction.gas = await getTransactionGas(chainId, transaction);
  transaction.fees = await getTransactionFees(chainId, transaction);
  transaction.amount = await getTransactionAmount(chainId, transaction);
}

export { completeTransaction };
