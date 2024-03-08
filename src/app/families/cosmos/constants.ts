type CosmosParams = {
  prefix: string;
  defaultPubKeyType: string;
  defaultGas: number;
  minGasPrice: number;
};

const COSMOS_GAS_AMPLIFIER = 1.5;
const COSMOS_MOCK_PUBKEY = "0388459b2653519948b12492f1a0b464720110c147a8155d23d423a5cc3c21d89a";

export type { CosmosParams };
export { COSMOS_GAS_AMPLIFIER, COSMOS_MOCK_PUBKEY };
