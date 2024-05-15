import { EvmService } from ".";
import { client } from "../client";

export async function getAddressState(this: EvmService, address: string) {
  const balance = await client(this.chainId).getBalance({ address: address as `0xstring` });

  return { balances: { available: balance } };
}
