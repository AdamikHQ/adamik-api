import { Status, Transaction } from "~/app/model/types_WIP";
import { AptosService } from "../service";
import { getClient } from "~/app/families/aptos/backend/node";
import { AptosTransactionParams } from "~/app/families/aptos/types";

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
      // The Move entry-function
      function: params.payload.function,
      functionArguments: params.payload.arguments,
      typeArguments: params.payload.type_arguments,
    },
  });
  transaction.encoded = tx.rawTransaction.toString();
}

async function encodeTransactionToBroadcast(
  this: AptosService,
  _: {
    signedTransaction: Transaction;
    status: Status;
  }
): Promise<string> {
  return "0x";
}

export { encodeTransactionToBroadcast, encodeTransactionToSign };
