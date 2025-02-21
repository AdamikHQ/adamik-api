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
      }
      break;
    case TransactionMode.STAKE:
      {
        if (
          !params.stakingPsbt ||
          !params.unbondingPsbt ||
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
        if (!params.unbondingPsbt) {
          console.warn(`Missing psbt in transaction:`, transaction);
          throw new AdamikApiServerError("Failed to retrieve computed psbt from transaction");
        }
        transaction.encoded = params.unbondingPsbt;
      }
      break;
    case TransactionMode.WITHDRAW:
      {
        // TODO
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
  if (!signedTransaction.signature) {
    throw new AdamikApiServerError("Missing transaction signature");
  }

  return signedTransaction.signature;
}

export { encodeTransactionToBroadcast, encodeTransactionToSign };
