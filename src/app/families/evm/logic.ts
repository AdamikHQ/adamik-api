import { CHAINS } from "~/app/config/chains";
import { ChainId, PlainTransaction } from "~/app/model/types_WIP";
import { EvmAddress, EvmParams } from "./types";
import { getNodeClient } from "./backend/node";
import { publicActionsL2 } from "viem/op-stack";
import { EtherscanERC20Event } from "./backend/types";

async function getFees(
  chainId: ChainId,
  transaction: PlainTransaction,
  gas: bigint,
  maxFeePerGas: bigint
): Promise<bigint> {
  const chainParams = CHAINS[chainId].params as EvmParams;

  if (chainParams.isL2Fees) {
    return await getNodeClient(chainId)
      .extend(publicActionsL2())
      .estimateTotalFee({
        to: transaction.recipients[0] as `0x${string}`,
        account: transaction.senders[0] as `0x${string}`,
        value: transaction.amount,
      });
  }

  return gas * maxFeePerGas;
}

// For each unique contract address in the list of events,
// store one arbitray event that's linked to that contract address.
// Since events contain token info, this allows to build the list of tokens linked to an address
function getOneEventPerContractAddress(events: EtherscanERC20Event[]): Map<EvmAddress, EtherscanERC20Event> {
  const eventPerContractAddress = new Map<EvmAddress, any>();
  for (const event of events) {
    if (!eventPerContractAddress.has(event.contractAddress)) {
      eventPerContractAddress.set(event.contractAddress, event);
    }
  }
  return eventPerContractAddress;
}

export { getFees, getOneEventPerContractAddress };
