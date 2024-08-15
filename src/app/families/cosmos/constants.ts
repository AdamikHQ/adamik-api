// Magic number, but just for safety
// Trade-off to ensure transactions don't get rejected, at the cost of fees maybe higher than optimal
// Same value as Keplr wallet: https://github.com/chainapsis/keplr-wallet/blob/0c4b89998cc75c483ff7d001ae21cc19cf027688/packages/hooks/src/tx/gas-simulator.ts#L130
const COSMOS_GAS_AMPLIFIER = 1.3;

// Only used for tx simulation and fees estimation
const COSMOS_MOCK_FEES = 2500n;
const COSMOS_MOCK_PUBKEY = "A4M9WuvnLKaOOBbEpGbTlSgJKfB8z1513E4tccLJLaRY";
const COSMOS_MOCK_SIGNATURE = new Uint8Array(64);

export { COSMOS_GAS_AMPLIFIER, COSMOS_MOCK_FEES, COSMOS_MOCK_PUBKEY, COSMOS_MOCK_SIGNATURE };
