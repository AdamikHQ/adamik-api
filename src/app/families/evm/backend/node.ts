import { fromHex, toHex } from "viem";
import { CHAINS } from "~/app/config/chains";
import { ChainId } from "~/app/model/types_WIP";

type FeeHistory = {
  baseFeePerGas: string[];
  gasUsedRatio: number[];
  oldestBlock: string;
  reward: string[][];
};

const getEthFeeHistory = async (chainId: ChainId, params: any): Promise<FeeHistory> => {
  const url = `${CHAINS[chainId].backends.nodeURL}`;

  const options: RequestInit = {
    method: "POST",
    body: JSON.stringify({
      id: 1,
      jsonrpc: "2.0",
      method: "eth_feeHistory",
      params,
    }),
  };

  const data: { result: FeeHistory } = await fetch(url, options)
    .then((response) => response.json())
    .catch((error) => console.error(error)); // FIXME: Handle error

  try {
    return data.result;
  } catch (error) {
    throw new Error(`getEthFeeHistory: ${error}`);
  }
};

const estimateMaxPriorityFeePerGas = async ({ chainId }: { chainId: ChainId }): Promise<bigint> => {
  const url = `${CHAINS[chainId].backends.nodeURL}`;

  const options: RequestInit = {
    method: "POST",
    body: JSON.stringify({
      id: 1,
      jsonrpc: "2.0",
      method: "eth_maxPriorityFeePerGas",
      params: [],
    }),
  };

  const data = await fetch(url, options)
    .then((response) => response.json())
    .catch((error) => console.error(error)); // FIXME: Handle error

  if (data?.result) {
    return BigInt(data.result);
  } else {
    throw new Error("No estimateMaxPriorityFeePerGas returned from the node");
  }
};

type estimateGasParams = {
  chainId: ChainId;
  data?: string;
  to: string;
  value: bigint;
};

const estimateGas = async ({ chainId, to, value, data }: estimateGasParams): Promise<bigint> => {
  const url = `${CHAINS[chainId].backends.nodeURL}`;

  const options: RequestInit = {
    method: "POST",
    body: JSON.stringify({
      id: 1,
      jsonrpc: "2.0",
      method: "eth_estimateGas",
      params: [
        {
          to,
          data: data ?? "0x",
          value: toHex(value),
        },
      ],
    }),
  };

  const nodeResponse = await fetch(url, options)
    .then((response) => response.json())
    .catch((error) => console.error(error)); // FIXME: Handle error

  if (nodeResponse?.result) {
    return fromHex(nodeResponse.result, "bigint");
  } else {
    throw new Error("No estime gas returned from the node");
  }
};

export {
  getEthFeeHistory,
  estimateMaxPriorityFeePerGas,
  estimateGas
}