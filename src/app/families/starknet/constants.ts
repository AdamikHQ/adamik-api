const STARK_TOKEN_CONTRACT_ID = "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d";
const ETH_TOKEN_CONTRACT_ID = "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7";
const STAKING_ADDRESS_CONTRACT_ID = "0x03745ab04a431fc02871a139be6b93d9260b0ff3e779ad9c8b377183b23109f1";

// selector is encoded hash of name of the function, we can't decode it to get it's name so we need to have a matching list in order to know which function is which
// TODO: Need to confirm that every wallet contract have the same selector for the same function
const SELECTOR_INDEX = [
  {
    name: "transfer",
    selector: "0x83afd3f4caedc6eebf44246fe54e38c95e3179a5ec9ea81740eca5b482d12e",
  },
];

export { ETH_TOKEN_CONTRACT_ID, SELECTOR_INDEX, STAKING_ADDRESS_CONTRACT_ID, STARK_TOKEN_CONTRACT_ID };
