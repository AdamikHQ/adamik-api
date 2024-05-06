import { getChain } from "~/app/config/chains";
import { ChainId, PlainTransaction } from "~/app/model/types_WIP";
import { EvmParams } from "./constants";
import { client } from "./client";
import { publicActionsL2 } from "viem/op-stack";

async function getFees(
  chainId: ChainId,
  transaction: PlainTransaction,
  gas: bigint,
  maxFeePerGas: bigint
): Promise<bigint> {
  const chainConfig = getChain<EvmParams>(chainId);

  if (chainConfig.params?.isL2Fees) {
    return await client(chainId)
      .extend(publicActionsL2())
      .estimateTotalFee({
        to: transaction.recipients[0] as `0x${string}`,
        account: transaction.senders[0] as `0x${string}`,
        value: transaction.amount,
      });
  }

  return gas * maxFeePerGas;
}

export { getFees };
