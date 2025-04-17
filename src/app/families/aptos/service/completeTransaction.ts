import { ChainId, Status, Transaction, TransactionData, TransactionMode } from "~/app/model/types_WIP";
import { UnsupportedFeatureError } from "~/app/tools/handlers/errors";
import { AptosService } from "../service";
import { fetchSequenceNumber, simulateTransaction } from "~/app/families/aptos/backend/node";
import { AptosTransactionParams } from "~/app/families/aptos/types";

async function completeTransaction(
  this: AptosService,
  _: {
    transaction: Transaction;
    status: Status;
  }
): Promise<void> {
  const { transaction, status } = _;

  try {
    const nonce = await fetchSequenceNumber(this.chainId, transaction.data.senderAddress);
    transaction.data.nonce = BigInt(nonce);

    switch (transaction.data.mode) {
      case TransactionMode.TRANSFER:
        await completeNativeTransaction(this.chainId, transaction.data);
        break;
      case TransactionMode.TRANSFER_TOKEN:
        await completeTokenTransaction(this.chainId, transaction.data);
        break;
      default:
        // should never happen, zod already validated the mode per chain
        throw new UnsupportedFeatureError(
          `Unsupported transaction mode ${transaction.data.mode} for chain ${this.chainId}`
        );
    }
  } catch (e: any) {
    const message = "Failed to complete the transaction";
    status.errors.push({ message });
  }
}

async function completeNativeTransaction(chainId: ChainId, transaction: TransactionData): Promise<void> {
  const simulationResult = await simulateTransaction(chainId, transaction);
  transaction.gas = BigInt(simulationResult.max_gas_amount);
  transaction.fees = BigInt(simulationResult.gas_used) * BigInt(simulationResult.gas_unit_price);
  transaction.amount = transaction.amount ?? 0n;
  transaction.params = {
    payload: {
      function: "0x1::aptos_account::transfer",
      arguments: [transaction.recipientAddress, transaction.amount.toString()],
    },
  };
}

async function completeTokenTransaction(chainId: ChainId, transaction: TransactionData): Promise<void> {
  const simulationResult = await simulateTransaction(chainId, transaction);
  transaction.gas = BigInt(simulationResult.max_gas_amount);
  transaction.fees = BigInt(simulationResult.gas_used) * BigInt(simulationResult.gas_unit_price);
  transaction.params = {
    payload: {
      function: "0x1::aptos_account::transfer",
      arguments: [transaction.recipientAddress, (transaction.amount ?? 0n).toString()],
    },
  };
  transaction.amount = 0n;
}

export { completeTransaction };
