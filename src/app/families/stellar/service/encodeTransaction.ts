import { Networks, TransactionBuilder } from "@stellar/stellar-sdk";
import { EncodedTransactionFormat, HashFunction, Status, Transaction } from "~/app/model/types_WIP";
import { UserInputError } from "~/app/tools/handlers/errors";
import { buildTransaction } from "../logic";
import { StellarService } from "../service";
import { StellarTransactionParams } from "../types";

async function encodeTransactionToSign(
  this: StellarService,
  _: {
    transaction: Transaction;
    status: Status;
  }
): Promise<void> {
  const { transaction } = _;

  const stellarTransaction = await buildTransaction(transaction.data);
  transaction.encoded = [
    {
      raw: {
        format: EncodedTransactionFormat.XDR,
        value: stellarTransaction.signatureBase().toString("hex"),
      },
      hash: {
        format: HashFunction.SHA256,
        value: stellarTransaction.hash().toString("hex"),
      },
    },
  ];

  transaction.data.params = {
    xdr: stellarTransaction.toXDR(),
  } as StellarTransactionParams;
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

  if (!signedTransaction.data.params || !("xdr" in signedTransaction.data.params)) {
    throw new UserInputError("Missing transaction params");
  }

  const xdr = (signedTransaction.data.params as StellarTransactionParams).xdr;

  const stellarTransaction = TransactionBuilder.fromXDR(xdr, Networks.PUBLIC);

  // The signature is expected to be in hex format as produced by ED25519 signing
  stellarTransaction.addSignature(
    signedTransaction.data.senderAddress,
    Buffer.from(signedTransaction.signature, "hex").toString("base64")
  );

  // Return the signed transaction as XDR string ready for broadcasting
  return stellarTransaction.toXDR();
}

export { encodeTransactionToBroadcast, encodeTransactionToSign };
