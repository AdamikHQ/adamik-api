import { Psbt } from "bitcoinjs-lib";
import { finalizeUnbondingBroadcastPayload } from "~/app/families/babylon/logic";
import { Status, Transaction, TransactionMode } from "~/app/model/types_WIP";
import { AdamikApiServerError } from "~/app/tools/handlers/errors";
import { BitcoinService } from "../service";
import { BitcoinTransactionParams } from "../types";

async function encodeTransactionToSign(
  this: BitcoinService,
  _: { transaction: Transaction; status: Status }
): Promise<void> {
  const { transaction, status } = _;

  const params = transaction.data.params as BitcoinTransactionParams;

  switch (transaction.data.mode) {
    case TransactionMode.TRANSFER:
      {
        if (!params.transferPsbt) {
          console.warn(`Missing psbt in transaction:`, transaction);
          throw new AdamikApiServerError("Failed to retrieve computed psbt from transaction");
        }
        transaction.encoded = params.transferPsbt;

        // Useless for the user in that case, so we remove it from the response
        delete transaction.data.params;
      }
      break;
    case TransactionMode.STAKE:
      {
        if (
          !params.stakingPsbt ||
          !params.unbondingTransaction ||
          !params.slashingPsbt ||
          !params.unbondingSlashingPsbt
        ) {
          console.warn(`Missing psbt(s) in transaction.params:`, transaction);
          throw new AdamikApiServerError("Failed to retrieve computed psbt from transaction");
        }
        transaction.encoded = params.stakingPsbt;
      }
      break;
    case TransactionMode.UNSTAKE:
      {
        if (!params.unbondingTransaction) {
          console.warn(`Missing psbt in transaction:`, transaction);
          throw new AdamikApiServerError("Failed to retrieve computed psbt from transaction");
        }

        transaction.encoded = params.unbondingTransaction;

        // Useless for the user in that case, so we remove it from the response
        delete transaction.data.params;
      }
      break;
    case TransactionMode.WITHDRAW:
      {
        if (!params.withdrawalPsbt) {
          console.warn(`Missing psbt in transaction:`, transaction);
          throw new AdamikApiServerError("Failed to retrieve computed psbt from transaction");
        }

        transaction.encoded = params.withdrawalPsbt;

        // Useless for the user in that case, so we remove it from the response
        delete transaction.data.params;
      }
      break;
  }
}

async function encodeTransactionToBroadcast(
  this: BitcoinService,
  _: {
    signedTransaction: Transaction;
    status: Status;
  }
): Promise<string> {
  const { signedTransaction } = _;

  // useless check to make the compiler happy, zod already validated the fields
  if (!signedTransaction.encoded) {
    throw new AdamikApiServerError("Missing encoded transaction");
  }
  if (!signedTransaction.signature) {
    throw new AdamikApiServerError("Missing transaction signature");
  }

  switch (signedTransaction.data.mode) {
    default:
      return signedTransaction.signature;
    case TransactionMode.UNSTAKE: {
      const partiallySignedUnbondingTransaction = Psbt.fromHex(
        signedTransaction.signature
      ).extractTransaction();

      // Babylon-specific required logic to add covenant unbonding signatures
      const signedUnbondingTransaction = await finalizeUnbondingBroadcastPayload(
        signedTransaction.data,
        partiallySignedUnbondingTransaction
      );

      return signedUnbondingTransaction.toHex();
    }
  }
}

export { encodeTransactionToBroadcast, encodeTransactionToSign };
