import { getNodeClient } from "../backend/node";
import { EvmService } from ".";
import { ChainId, Amount, Unit, AddressState } from "~/app/model/types_WIP";
import ERC20ABI from "../abi/erc20.abi.json";
import { getERC20TransferEvents } from "../backend/explorer";
import { EvmAddress } from "../types";
import { CHAINS } from "~/app/config/chains";
import { getOneEventPerContractAddress } from "../logic";
import { getContract } from "viem";

async function getAddressState(this: EvmService, address: EvmAddress): Promise<AddressState> {
  // Native
  const nativeBalance = await getNodeClient(this.chainId).getBalance({ address: address });
  const nativeAmount: Amount = {
    unit: CHAINS[this.chainId].unit,
    value: nativeBalance,
  };

  // Tokens
  const tokenAmounts: Amount[] = [];

  const events = await getERC20TransferEvents(this.chainId, address);
  const eventPerContractAddress = getOneEventPerContractAddress(events);

  for (const event of eventPerContractAddress.values()) {
    const { contractAddress, tokenName, tokenSymbol, tokenDecimal } = event;
    const tokenBalance = await getERC20Balance(this.chainId, contractAddress, address);
    const tokenUnit: Unit = {
      id: tokenName,
      tag: tokenSymbol,
      decimals: +tokenDecimal, // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Unary_plus
    };
    tokenAmounts.push({
      unit: tokenUnit,
      value: tokenBalance,
    });
  }

  return {
    chainId: this.chainId,
    balances: {
      native: {
        available: nativeAmount,
      },
      tokens: tokenAmounts,
    },
  };
}

async function getERC20Balance(
  chainId: ChainId,
  contractAdress: EvmAddress,
  address: EvmAddress
): Promise<bigint> {
  const client = getNodeClient(chainId);

  return (await client.readContract({
    address: contractAdress,
    abi: ERC20ABI,
    functionName: "balanceOf",
    args: [address],
  })) as bigint;
}

export { getAddressState };
