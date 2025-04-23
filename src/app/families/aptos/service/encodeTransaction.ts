import { Status, Transaction } from "~/app/model/types_WIP";
import { AptosService } from "../service";
import { getClient } from "~/app/families/aptos/backend/node";
import { AptosTransactionParams } from "~/app/families/aptos/types";
import {
  Deserializer,
  Ed25519PublicKey,
  Ed25519Signature,
  generateSigningMessageForTransaction,
  RawTransaction,
  SignedTransaction,
  TransactionAuthenticatorEd25519,
} from "@aptos-labs/ts-sdk";

async function encodeTransactionToSign(
  this: AptosService,
  _: {
    transaction: Transaction;
    status: Status;
  }
): Promise<void> {
  const { transaction } = _;
  const client = getClient(this.chainId);
  const params = transaction.data.params as AptosTransactionParams;
  const tx = await client.transaction.build.simple({
    sender: transaction.data.senderAddress,
    data: {
      function: params.payload!.function,
      functionArguments: params.payload!.arguments,
      typeArguments: params.payload!.type_arguments,
    },
  });
  const signingMessage = generateSigningMessageForTransaction(tx);
  transaction.encoded = Buffer.from(signingMessage).toString("hex");
  transaction.data.params = {
    rawTransaction: tx.rawTransaction.toString().slice(2),
  };
}

async function encodeTransactionToBroadcast(
  this: AptosService,
  _: {
    signedTransaction: Transaction;
    status: Status;
  }
): Promise<string> {
  const { signedTransaction } = _;
  const params = signedTransaction.data.params as AptosTransactionParams;
  const rawTxHex = params.rawTransaction!;
  const deserializer = new Deserializer(Buffer.from(rawTxHex, "hex"));

  const publicKey = new Ed25519PublicKey(signedTransaction.data.senderPubKey!);
  const signature = Buffer.from(signedTransaction.signature!, "hex");
  const authenticator = new TransactionAuthenticatorEd25519(publicKey, new Ed25519Signature(signature));
  const rawTransaction = RawTransaction.deserialize(deserializer);

  const signedTx = new SignedTransaction(rawTransaction, authenticator);
  return Buffer.from(signedTx.bcsToBytes()).toString("hex");
}

export { encodeTransactionToBroadcast, encodeTransactionToSign };
