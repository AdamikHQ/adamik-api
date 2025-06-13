import { Status, Transaction, TransactionMode } from "~/app/model/types_WIP";
import { AptosService } from "~/app/families/aptos/service";
import { prevalidateTransactionCommon } from "~/app/families/common";
import { validateAddress } from "~/app/families/aptos/service/validateAddress";
import { getMaxSpendable } from "~/app/families/aptos/logic";
import { UnsupportedFeatureError } from "~/app/tools/handlers/errors";
import { fetchStakingAmounts } from "~/app/families/aptos/backend/node";

export async function prevalidateTransaction(
  this: AptosService,
  _: {
    transaction: Transaction;
    status: Status;
  }
): Promise<void> {
  const { transaction, status } = _;

  await prevalidateTransactionCommon(this.chainId, {
    transactionData: transaction.data,
    status,
    addressValidationFn: validateAddress,
  });
}

export async function validateTransaction(
  this: AptosService,
  _: {
    transaction: Transaction;
    status: Status;
  }
): Promise<void> {
  const { transaction, status } = _;

  const maxSpendable = await getMaxSpendable(this.chainId, transaction.data);

  const amount = transaction.data.amount ?? 0n;
  const fees = transaction.data.fees ?? 0n;

  switch (transaction.data.mode) {
    case TransactionMode.TRANSFER: {
      if (amount + fees > maxSpendable.native) {
        status.errors.push({ message: "Balance is too low" });
      } else if (amount < fees * 10n) {
        status.warnings.push({ message: "Network fees are above 10% of the amount" });
      }
      break;
    }
    case TransactionMode.TRANSFER_TOKEN: {
      if (fees > maxSpendable.native) {
        status.errors.push({
          message: "Balance is too low to cover the fees",
        });
      }
      if (maxSpendable.token === undefined || amount > maxSpendable.token) {
        status.errors.push({ message: "Token balance is too low" });
      }
      break;
    }
    case TransactionMode.STAKE: {
      // Min staking amount is hard-coded in the DelegationPool contract
      // https://github.com/aptos-labs/aptos-core/blob/8d334a240ce4920c3651369404f53f2f602beafc/aptos-move/framework/aptos-framework/sources/delegation_pool.move#L244
      if (amount <= 10_00000000n) {
        status.errors.push({
          message: "The minimum delegation amount is 10 APT",
        });
      }
      if (amount + fees > maxSpendable.native) {
        status.errors.push({
          message: "Balance is too low",
        });
      }
      break;
    }
    case TransactionMode.UNSTAKE: {
      if (fees > maxSpendable.native) {
        status.errors.push({
          message: "Balance is too low",
        });
      }
      const { locked } = await fetchStakingAmounts(
        this.chainId,
        transaction.data.senderAddress,
        transaction.data.validatorAddress
      );
      if (amount > BigInt(locked)) {
        status.errors.push({
          message: "Unstake amount exceeds locked value",
        });
      }
      break;
    }
    case TransactionMode.WITHDRAW: {
      if (fees > maxSpendable.native) {
        status.errors.push({
          message: "Balance is too low",
        });
      }
      const { unlocked } = await fetchStakingAmounts(
        this.chainId,
        transaction.data.senderAddress,
        transaction.data.validatorAddress
      );
      if (amount > BigInt(unlocked)) {
        status.errors.push({
          message: "Withdraw amount exceeds unlocked value",
        });
      }
      break;
    }
    default:
      throw new UnsupportedFeatureError(
        `Unsupported transaction mode ${transaction.data.mode} for chain ${this.chain.name}`
      );
  }
}
