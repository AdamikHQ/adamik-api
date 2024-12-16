import { EncodedTransactionFormat, Status, Transaction } from "~/app/model/types_WIP";
import { fetchAccount } from "../backend/node";
import { encodeToBroadcast, encodeToSign, resolvePubKey } from "../logic";
import { CosmosService } from "../service";

async function encodeTransactionToSign(
  this: CosmosService,
  args: {
    transaction: Transaction;
    status: Status;
  }
): Promise<void> {
  const { transaction } = args;

  const account = await fetchAccount(this.chainId, transaction.data.sender);

  transaction.encoded = await encodeToSign(
    this.chainId,
    account,
    transaction.data,
    transaction.data.format ?? EncodedTransactionFormat.HEX
  );
}

async function encodeTransactionToBroadcast(
  this: CosmosService,
  args: {
    signedTransaction: Transaction;
    status: Status;
  }
): Promise<string> {
  const { signedTransaction } = args;

  // Useless checks to make the compiler happy, Zod already validated the fields
  if (!signedTransaction.encoded) {
    throw new Error("Missing encoded transaction");
  }
  if (!signedTransaction.signature) {
    throw new Error("Missing transaction signature");
  }

  const account = await fetchAccount(this.chainId, signedTransaction.data.sender);
  const updatedAccount = resolvePubKey(this.chainId, account, signedTransaction);

  return await encodeToBroadcast(this.chainId, updatedAccount, signedTransaction);
}

export { encodeTransactionToBroadcast, encodeTransactionToSign };
