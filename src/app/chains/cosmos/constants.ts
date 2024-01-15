import { NODES } from "~/app/config/constants";
import { ChainId } from "~/app/model/types_WIP";

// TODO Proper CAL + multi-chain family
type CosmosParams = {
  lcd: string;
  prefix: string;
  defaultPubKeyType: string;
  defaultGas: number;
  minGasPrice: number;
};

const COSMOS_PARAMS: Map<ChainId, CosmosParams> = new Map([
  [
    ChainId.COSMOS,
    {
      lcd: NODES.get(ChainId.COSMOS)!,
      prefix: "cosmos",
      defaultPubKeyType: "/cosmos.crypto.secp256k1.PubKey",
      defaultGas: 100000,
      minGasPrice: 0.025,
    },
  ],
]);

const COSMOS_NODE_URL = COSMOS_PARAMS.get(ChainId.COSMOS)!.lcd;

const COSMOS_GAS_AMPLIFIER = 1.5;
const COSMOS_MOCK_PUBKEY = "0388459b2653519948b12492f1a0b464720110c147a8155d23d423a5cc3c21d89a";

export { COSMOS_PARAMS, COSMOS_NODE_URL, COSMOS_GAS_AMPLIFIER, COSMOS_MOCK_PUBKEY };
