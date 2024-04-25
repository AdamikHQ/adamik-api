import { ChainId } from "~/app/model/types_WIP";
import { multiplyFloat } from "~/lib/bigintmultiply";
import { estimateMaxPriorityFeePerGas, getEthFeeHistory } from "./backend/node";
import { ETHEREUM_GAS_AMPLIFIER } from "./constants";

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

    return {
      maxPriorityFeePerGas,
      maxFeePerGas: multiplyFloat(nextBaseFee, ETHEREUM_GAS_AMPLIFIER) + maxPriorityFeePerGas,
    };
  } catch (error) {
    throw new Error(`getEstimatedFees: ${error}`);
  }
};
