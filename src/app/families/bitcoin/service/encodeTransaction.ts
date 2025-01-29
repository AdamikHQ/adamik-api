import { Status, Transaction } from "~/app/model/types_WIP";
import { AdamikApiServerError } from "~/app/tools/handlers/errors";
import { BitcoinService } from "../service";
import { BitcoinTransactionParams } from "../types";

async function encodeTransactionToSign(
  this: BitcoinService,
  _: { transaction: Transaction; status: Status }
): Promise<void> {
  const { transaction, status } = _;

  const params = transaction.data.params as BitcoinTransactionParams;

  if (!params.psbt) {
    console.warn("Failed to retrieve computed psbt from transaction");
    throw new AdamikApiServerError("Failed to retrieve computed psbt from transaction");
  }

  transaction.encoded = params.psbt.toHex();

  // Was only used to transfer internal data from completeTransaction to encodeTransaction
  delete transaction.data.params;
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
    throw new AdamikApiServerError("missing transaction signature");
  }

  return signedTransaction.signature;
}

export { encodeTransactionToBroadcast, encodeTransactionToSign };
