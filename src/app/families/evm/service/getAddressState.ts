import { getBalance, getERC20Balance } from "../backend/node";
import { EvmService } from ".";
import { AddressState, TokenAmount } from "~/app/model/types_WIP";
import { getERC20TransferEvents } from "../backend/explorer";
import { EvmAddress } from "../types";
import { getOneEventPerContractAddress } from "../logic";

async function getAddressState(this: EvmService, address: EvmAddress): Promise<AddressState> {
  // Native
  const nativeBalance = await getBalance(this.chainId, address);

  // Tokens
  const tokenAmounts: TokenAmount[] = [];

  const events = await getERC20TransferEvents(this.chainId, address);
  const eventPerContractAddress = getOneEventPerContractAddress(events);

  for (const { contractAddress } of eventPerContractAddress.values()) {
    try {
      const tokenBalance = await getERC20Balance({
        chainId: this.chainId,
        contractAddress,
        senderAddress: address,
      });

      // For now we filter any error while retrieving balance -OR- balance of 0
      if (tokenBalance) {
        tokenAmounts.push({
          tokenId: contractAddress,
          value: tokenBalance,
        });
      }
    } catch {}
  }

  return {
    chainId: this.chainId,
    address,
    balances: {
      native: {
        available: nativeBalance,
      },
      tokens: tokenAmounts,
    },
  };
}

export { getAddressState };
