import { getCurrentBabylonStakingParams } from "~/app/families/babylon/logic";
import { Status, Transaction, TransactionMode } from "~/app/model/types_WIP";
import { isValidAddress, isValidXpub } from "../logic";
import { BitcoinService } from "../service";

async function prevalidateTransaction(
  this: BitcoinService,
  _: {
    transaction: Transaction;
    status: Status;
  }
): Promise<void> {
  const { transaction, status } = _;

  if (
    !isValidXpub(this.chainId, transaction.data.senderAddress) &&
    !isValidAddress(this.chainId, transaction.data.senderAddress)
  ) {
    status.errors.push({
      message: `Sender address ${transaction.data.senderAddress} is invalid for ${this.chainId}`,
    });
  }

  // TODO If senderPubKey is provided, validate that it matches with senderAddress
  // TODO Check there are enough UTXOs to cover the amount and/or fees

  switch (transaction.data.mode) {
    case TransactionMode.TRANSFER:
      if (!isValidAddress(this.chainId, transaction.data.recipientAddress)) {
        status.errors.push({
          message: `Recipient address ${transaction.data.recipientAddress} is invalid for ${this.chainId}`,
        });
      }
      break;
    case TransactionMode.UNSTAKE:
    case TransactionMode.WITHDRAW:
      // TODO Validate that the address is either Taproot or Native Segwit
      // TODO Validator address validation

      if (!transaction.data.stakeId?.length) {
        status.errors.push({
          message: `Stake ID must be provided for ${this.chainId} transaction mode '${transaction.data.mode}'`,
        });
      }

      if (isValidXpub(this.chainId, transaction.data.senderAddress)) {
        status.errors.push({
          message: `Xpub are not supported for ${this.chainId} transaction mode '${transaction.data.mode}'`,
        });
      }

      if (!transaction.data.senderPubKey) {
        status.errors.push({ message: "Public key of the sender address is required" });
      }

      if (transaction.data.amount || transaction.data.useMaxAmount) {
        status.warnings.push({
          message: `Amount cannot be configured for ${this.chainId} ${transaction.data.mode} transactions, it will be ignored`,
        });
      }

      break;
    case TransactionMode.STAKE:
      // TODO Validate that the address is either Taproot or Native Segwit
      // TODO Validator address validation

      if (isValidXpub(this.chainId, transaction.data.senderAddress)) {
        status.errors.push({
          message: `Xpub are not supported for ${this.chainId} transaction mode '${transaction.data.mode}'`,
        });
      }

      if (!transaction.data.senderPubKey) {
        status.errors.push({ message: "Public key of the sender address is required" });
      }

      // FIXME Try to support useMaxAmount for staking transactions too?
      if (transaction.data.useMaxAmount) {
        status.errors.push({
          message: `useMaxAmount is not supported for ${this.chainId} staking transactions`,
        });
      }

      if (transaction.data.amount === undefined) {
        status.errors.push({
          message: `Amount must be provided for ${this.chainId} stake transactions`,
        });
      } else {
        const { minStakingAmountSat, maxStakingAmountSat } = await getCurrentBabylonStakingParams(
          this.chainId
        );

        if (transaction.data.amount < minStakingAmountSat || transaction.data.amount > maxStakingAmountSat) {
          status.errors.push({
            message: `Invalid staking amount ${transaction.data.amount}, must be between ${minStakingAmountSat} and ${maxStakingAmountSat}`,
          });
        }
      }

      break;
  }
}

async function validateTransaction(
  this: BitcoinService,
  _: {
    transaction: Transaction;
    status: Status;
  }
): Promise<void> {
  const { transaction, status } = _;

  // TODO Check that amount > dust
  /*
  const transactionData = transaction.data;
  // amount & fees are safe to cast as they're guaranteed to be filed in by completeTransaction
  const amount = transactionData.amount as bigint;
  const fees = transactionData.fees as bigint;
  */

  return;
}

export { prevalidateTransaction, validateTransaction };
