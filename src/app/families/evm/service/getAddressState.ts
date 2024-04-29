import { getClient } from "../client";
import { ChainId } from "~/app/model/types_WIP";

export async function getAddressState(chainId: ChainId, address: string) {
  const balance = await client(chainId).getBalance({ address: address as `0xstring` });

  return { balances: { available: balance } };
}
