import { pubkeyToAddress as aminoPubkeyToAddress, encodeSecp256k1Pubkey } from "@cosmjs/amino";
import { fromBase64 } from "@cosmjs/encoding";
import { PublicKey } from "@injectivelabs/sdk-ts";
import { CHAINS } from "~/app/config/chains";
import { CosmosChainParams } from "~/app/families/cosmos/types";
import { ChainId, TypedAddress } from "~/app/model/types_WIP";
import { isHex } from "../logic";
import { CosmosService } from "../service";

async function pubkeyToAddresses(this: CosmosService, pubkey: string): Promise<TypedAddress[]> {
  const chain = CHAINS[this.chainId];
  const chainParams = chain.params as CosmosChainParams;

  const pubkeyBase64 = isHex(pubkey) ? Buffer.from(pubkey, "hex").toString("base64") : pubkey;

  // Special handling for chains using Ethereum's secp256k1 curve
  if (this.chainId === ChainId.INJECTIVE) {
    return [{ address: PublicKey.fromBase64(pubkeyBase64).toAddress().toBech32(), type: "default" }];
  }

  // EVMOS uses ethsecp256k1 just like Injective
  if (this.chainId === ChainId.EVMOS) {
    // Use PublicKey from Injective which handles the ethsecp256k1 curve correctly
    // but override the prefix to use EVMOS prefix
    const pubKey = PublicKey.fromBase64(pubkeyBase64);
    const address = pubKey.toAddress().toBech32("evmos");
    return [{ address, type: "default" }];
  }

  const pubKeyBuffer = fromBase64(pubkeyBase64);

  const aminoPubKey = encodeSecp256k1Pubkey(pubKeyBuffer);

  const address = aminoPubkeyToAddress(aminoPubKey, chainParams.prefix);

  return [{ address, type: "default" }];
}

export { pubkeyToAddresses };
