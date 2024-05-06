import { EstimateGasErrorType } from "viem";
import { ChainId, PlainTransaction } from "~/app/model/types_WIP";
import { client } from "../client";
import { getFees } from "../logic";

// TODO Make sure heavy functions aren't called multiple times / unnecessarily
// (buildTransaction, network calls, etc...)

async function completeTransaction(
  chainId: ChainId,
  transaction: PlainTransaction
): Promise<PlainTransaction> {
  try {
    const gas = await client(chainId).estimateGas({
      account: transaction.senders[0] as `0x${string}`,
      to: transaction.recipients[0] as `0x${string}`,
      value: transaction.amount,
    });

    const { maxFeePerGas } = await client(chainId).estimateFeesPerGas();

    if (maxFeePerGas === undefined) {
      throw new Error("maxFeePerGas is undefined");
    }

    const fees = await getFees(chainId, transaction, gas, maxFeePerGas);

    const amount = await (async () => {
      if (transaction.useMaxAmount) {
        const balance = await client(chainId).getBalance({
          address: transaction.senders[0] as `0x${string}`,
        });

        return balance - fees;
      }
      return transaction.amount;
    })();

    return {
      ...transaction,
      amount,
      fees,
      gas,
    };
  } catch (e: any) {
    if (e.name === "EstimateGasExecutionError") {
      const error = e as EstimateGasErrorType;
      throw new Error(error.details);
    }
    throw e;
  }
}

export { completeTransaction };
