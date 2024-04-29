import { ChainId, PlainTransaction } from "~/app/model/types_WIP";
import { client } from "../client";
import { estimateGas } from "../backend/node";
import { getChain } from "~/app/config/chains";
import { EthereumParams } from "../constants";
import { publicActionsL2 } from "viem/op-stack";
import { getEstimatedFees } from "../logic";

// TODO Make sure heavy functions aren't called multiple times / unnecessarily
// (buildTransaction, network calls, etc...)

async function completeTransaction(
  chainId: ChainId,
  transaction: PlainTransaction
): Promise<PlainTransaction> {
  const gas = await estimateGas({
    chainId,
    to: transaction.recipients[0] as `0x${string}`,
    value: transaction.amount,
  });

  const { maxFeePerGas } = await getEstimatedFees(chainId);

  if (maxFeePerGas === undefined) {
    throw new Error("maxFeePerGas is undefined");
  }

  const chainConfig = getChain<EthereumParams>(chainId);

  const fees = chainConfig.params?.isL2Fees
    ? await client(chainId)
        .extend(publicActionsL2())
        .estimateTotalFee({
          to: transaction.recipients[0] as `0x${string}`,
          account: transaction.senders[0] as `0x${string}`,
          value: transaction.amount,
        })
    : maxFeePerGas * gas;

  const amount = await (async () => {
    if (transaction.useMaxAmount) {
      const balance = await client(chainId).getBalance({ address: transaction.senders[0] as `0x${string}` });

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
}

export { completeTransaction };
