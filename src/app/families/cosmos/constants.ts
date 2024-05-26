// Magic number, but just for safety
// Trade-off to ensure transactions don't get rejected, at the cost of fees maybe higher than optimal
const COSMOS_GAS_AMPLIFIER = 1.6;

// Only used for tx simulation and fees estimation
const COSMOS_MOCK_PUBKEY = "0388459b2653519948b12492f1a0b464720110c147a8155d23d423a5cc3c21d89a";

export { COSMOS_GAS_AMPLIFIER, COSMOS_MOCK_PUBKEY };
