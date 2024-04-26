import { ChainId } from "~/app/model/types_WIP";
import { estimateMaxPriorityFeePerGas, getEthFeeHistory } from "./backend/node";
import { ETHEREUM_GAS_AMPLIFIER } from "./constants";
import { BigNumber } from "bignumber.js";

type EstimatedFees = {
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
};

export const getEstimatedFees = async (chainId: ChainId): Promise<EstimatedFees> => {
  try {
    const maxPriorityFeePerGas = await estimateMaxPriorityFeePerGas({ chainId });

    const feeHistory = await getEthFeeHistory(chainId, [
      "0x10", // Fetching the history for 10 blocks
      "latest", // from the latest block
      [50], // 50% percentile sample
    ]);

    const nextBaseFee = BigInt(feeHistory.baseFeePerGas[feeHistory.baseFeePerGas.length - 1]);
    const maxFeePerGas = new BigNumber(nextBaseFee.toString())
      .times(ETHEREUM_GAS_AMPLIFIER)
      .integerValue(BigNumber.ROUND_CEIL)
      .plus(maxPriorityFeePerGas.toString());

    return {
      maxPriorityFeePerGas,
      maxFeePerGas: BigInt(maxFeePerGas.toFixed()),
    };
  } catch (error) {
    throw new Error(`getEstimatedFees: ${error}`);
  }
};
