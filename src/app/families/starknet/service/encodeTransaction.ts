import { num } from "starknet";
import { HashFunction, Status, Transaction } from "~/app/model/types_WIP";
import { InvalidTransactionError } from "~/app/tools/handlers/errors";
import { buildTransaction } from "../logic";
import { StarknetService } from "../service";
import { StarknetTransactionParams } from "../types";

async function encodeTransactionToSign(
  this: StarknetService,
  _: {
    transaction: Transaction;
    status: Status;
  }
): Promise<void> {
  const { transaction } = _;

  const starknetTransaction = await buildTransaction(this.chainId, transaction);

  if (!starknetTransaction) {
    throw new Error("Failed to build transaction");
  }

  // TODO: check if we can have less than an hash
  // Doesn't seems to be the case but less dig later : https://starknetjs.com/docs/guides/signature
  transaction.encoded = [
    {
      hash: {
        format: HashFunction.PEDERSEN,
        value: num.toHex64(starknetTransaction.payload.toSign),
      },
    },
  ];

  transaction.data.params = {
    payload: starknetTransaction.payload,
    details: starknetTransaction.details,
  } as StarknetTransactionParams;
}

async function encodeTransactionToBroadcast(
  this: StarknetService,
  _: {
    signedTransaction: Transaction;
    status: Status;
  }
): Promise<string> {
  const { signedTransaction } = _;

  const params = signedTransaction.data.params as StarknetTransactionParams;
  if (!params) {
    throw new InvalidTransactionError({
      errors: [{ message: "Transaction params are required" }],
      warnings: [],
    });
  }

  return JSON.stringify({
    mode: signedTransaction.data.mode,
    payload: { ...params.payload, signature: signedTransaction.signature },
    details: params.details,
  });
}

export { encodeTransactionToBroadcast, encodeTransactionToSign };
