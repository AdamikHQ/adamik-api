import { pubkeyToAddress as aminoPubkeyToAddress, encodeSecp256k1Pubkey } from "@cosmjs/amino";
import { fromBase64 } from "@cosmjs/encoding";
import { PublicKey } from "@injectivelabs/sdk-ts";
import { CHAINS } from "~/app/config/chains";
import { CosmosChainParams } from "~/app/families/cosmos/types";
import { ChainId, TypedAddress } from "~/app/model/types_WIP";
import { CosmosService } from ".";
import { isHex } from "../logic";

async function pubkeyToAddresses(this: CosmosService, pubkey: string): Promise<TypedAddress[]> {
  const chain = CHAINS[this.chainId];
  const chainParams = chain.params as CosmosChainParams;

  const pubkeyBase64 = isHex(pubkey) ? Buffer.from(pubkey, "hex").toString("base64") : pubkey;

  if (this.chainId === ChainId.INJECTIVE) {
    return [{ address: PublicKey.fromBase64(pubkeyBase64).toAddress().toBech32(), type: "default" }];
  }

  const pubKeyBuffer = fromBase64(pubkeyBase64);

  const aminoPubKey = encodeSecp256k1Pubkey(pubKeyBuffer);

  const address = aminoPubkeyToAddress(aminoPubKey, chainParams.prefix);

  return [{ address, type: "default" }];
}

export { pubkeyToAddresses };
