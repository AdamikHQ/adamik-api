import { Networks, TransactionBuilder } from "@stellar/stellar-sdk";
import { EncodedTransactionFormat, HashFunction, Status, Transaction } from "~/app/model/types_WIP";
import { UserInputError } from "~/app/tools/handlers/errors";
import { buildTransaction } from "../logic";
import { StellarService } from "../service";

async function encodeTransactionToSign(
  this: StellarService,
  _: {
    transaction: Transaction;
    status: Status;
  }
): Promise<void> {
  const { transaction } = _;

  const stellarTransaction = await buildTransaction(transaction.data);

  const xdrString = stellarTransaction.toXDR();

  // Calculate the transaction hash using Stellar SDK's built-in method
  const transactionHash = stellarTransaction.hash().toString("hex");

  transaction.encoded = [
    {
      raw: {
        format: EncodedTransactionFormat.XDR,
        value: xdrString,
      },
      hash: {
        format: HashFunction.SHA256,
        value: transactionHash,
      },
    },
  ];
}

async function encodeTransactionToBroadcast(
  this: StellarService,
  _: {
    signedTransaction: Transaction;
    status: Status;
  }
): Promise<string> {
  const { signedTransaction } = _;

  // Validate required fields
  if (!signedTransaction.encoded) {
    throw new UserInputError("Missing encoded transaction");
  }
  if (!signedTransaction.signature) {
    throw new UserInputError("Missing transaction signature");
  }

  // Find the XDR-encoded transaction
  const encodedTransaction = signedTransaction.encoded.find(
    (e) => e.raw?.format === EncodedTransactionFormat.XDR
  );

  if (!encodedTransaction || !encodedTransaction.raw?.value) {
    throw new UserInputError("Missing XDR-encoded transaction");
  }

  // Parse the XDR transaction
  const stellarTransaction = TransactionBuilder.fromXDR(encodedTransaction.raw.value, Networks.PUBLIC);

  // Add the signature to the transaction
  // Note: The signature is expected to be in hex format as produced by ED25519 signing
  stellarTransaction.addSignature(signedTransaction.data.senderAddress, signedTransaction.signature);

  // Return the signed transaction as XDR string ready for broadcasting
  return stellarTransaction.toXDR();
}

export { encodeTransactionToBroadcast, encodeTransactionToSign };
