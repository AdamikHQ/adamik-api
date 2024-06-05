import { PlainTransaction } from "~/app/model/types_WIP";
import { estimateFeesPerGas } from "../backend/node";
import { getTransactionFees, getTransactionAmount, getTransactionGas } from "../logic";
import { EvmService } from ".";

async function completeTransaction(
  this: EvmService,
  transaction: PlainTransaction
): Promise<PlainTransaction> {
  const gas = await getTransactionGas(this.chainId, transaction);

  const { maxFeePerGas } = await estimateFeesPerGas(this.chainId);
  if (maxFeePerGas === undefined) {
    throw new Error("maxFeePerGas is undefined");
  }

  const fees = await getTransactionFees(this.chainId, transaction, gas, maxFeePerGas);

  const amount = await getTransactionAmount(this.chainId, transaction, fees);

  return {
    ...transaction,
    amount,
    fees,
    gas,
  };
}

export { completeTransaction };
