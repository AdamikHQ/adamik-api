import { EncodedTransactionFormat, HashFunction, Status, Transaction } from "~/app/model/types_WIP";
import { sha256 } from "~/app/tools/hash";
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

  const account = await fetchAccount(this.chainId, transaction.data.senderAddress);

  const rawTransactions = await encodeToSign(this.chainId, account, transaction.data);

  transaction.encoded = [
    {
      raw: {
        format: EncodedTransactionFormat.SIGNDOC_DIRECT,
        value: rawTransactions[EncodedTransactionFormat.SIGNDOC_DIRECT],
      },
      hash: {
        format: HashFunction.SHA256,
        value: sha256(Buffer.from(rawTransactions[EncodedTransactionFormat.SIGNDOC_DIRECT], "hex")),
      },
    },
    {
      raw: {
        format: EncodedTransactionFormat.SIGNDOC_DIRECT_JSON,
        value: rawTransactions[EncodedTransactionFormat.SIGNDOC_DIRECT_JSON],
      },
    },
  ];
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

  const account = await fetchAccount(this.chainId, signedTransaction.data.senderAddress);
  const { pubKey, pubKeyType } = resolvePubKey(this.chainId, account, signedTransaction.data);

  const updatedAccount = {
    ...account,
    pubKey,
    pubKeyType,
  };

  return await encodeToBroadcast(this.chainId, updatedAccount, signedTransaction);
}

export { encodeTransactionToBroadcast, encodeTransactionToSign };
