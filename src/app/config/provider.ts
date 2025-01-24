import { Backend, ChainFamily, ChainId, SupportedProvider } from "~/app/model/types_WIP";
import { DataSourceInterface } from "~/app/data-source/data-source-interface";
import { EvmRpc } from "~/app/data-source/evm-rpc";
import { CHAINS } from "~/app/config/chains";
import { Blockscout } from "~/app/data-source/blockscout";
import { Moralis } from "~/app/data-source/moralis";
import { MORALIS_API_KEY } from "~/app/config/apiKeys";

// Note: this might evolve to replace services. Instead of nested `switch` statements, it would look for a
//       provider (backend) that supports (chainId) for a given set of (features)
export function getProvider(chainId: ChainId, backend: Backend): DataSourceInterface {
  const family = CHAINS[chainId]?.family;
  switch (family) {
    case ChainFamily.EVM:
      switch (backend.provider) {
        case SupportedProvider.NODE:
          return new EvmRpc(backend.url);
        case SupportedProvider.BLOCKSCOUT:
          return new Blockscout(backend.url);
        case SupportedProvider.MORALIS:
          return new Moralis(MORALIS_API_KEY);
      }
    default:
      throw new Error(`No node provider available for ${family} chains`);
  }
}
