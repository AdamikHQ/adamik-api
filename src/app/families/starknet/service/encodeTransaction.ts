import { hexToString, stringToHex } from "viem";
import { HashFunction, Status, Transaction } from "~/app/model/types_WIP";
import { InvalidTransactionError } from "~/app/tools/handlers/errors";
import { buildTransaction } from "../logic";
import { StarknetService } from "../service";
import { StarknetTransactionParams, starknetTransactionParamsPayloadSchema } from "../types";

async function encodeTransactionToSign(
  this: StarknetService,
  _: {
    transaction: Transaction;
    status: Status;
  }
): Promise<void> {
  const { transaction } = _;

  const payload = await buildTransaction(transaction);

  if (!payload) {
    throw new Error("Failed to build transaction");
  }

  // TODO: check if we can have less than an hash
  // Doesn't seems to be the case but less dig later : https://starknetjs.com/docs/guides/signature
  transaction.encoded = [
    {
      hash: {
        format: HashFunction.PEDERSEN,
        value: payload.payload.toSign,
      },
    },
  ];
  const params = stringToHex(
    JSON.stringify({
      mode: transaction.data.mode,
      payload: payload.payload,
      details: payload.details,
    })
  );

  transaction.data.params = params;
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

  const payload = hexToString(params as `0x${string}`);
  const decodePayload = JSON.parse(payload);
  const parsedPayload = starknetTransactionParamsPayloadSchema.parse(decodePayload);

  return JSON.stringify({
    mode: signedTransaction.data.mode,
    payload: { ...parsedPayload.payload, signature: signedTransaction.signature },
    details: { ...parsedPayload.details },
  });
}

export { encodeTransactionToBroadcast, encodeTransactionToSign };
