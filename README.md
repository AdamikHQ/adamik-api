# Adamik API

A unified REST API for interacting with multiple blockchains. Adamik API provides a single interface to read balances, build transactions, encode/sign payloads, and broadcast across 65+ chains and 10 blockchain families.

## Supported Chains

| Family       | Chains                                                                                                                                                             |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **EVM**      | Ethereum, Base, Optimism, Arbitrum, Polygon, zkSync, BSC, Linea, Avalanche, Gnosis, Moonbeam, Moonriver, Fantom, Mantle, Rootstock, Chiliz, Hyperliquid + testnets |
| **Cosmos**   | Cosmos Hub, Osmosis, Celestia, dYdX, Injective, Akash, Band, Stargaze, Kujira, Sei, Saga, Coreum + testnets                                                        |
| **Bitcoin**  | Bitcoin, Litecoin, Dogecoin + testnets                                                                                                                             |
| **Solana**   | Solana, Solana Devnet                                                                                                                                              |
| **TON**      | TON                                                                                                                                                                |
| **Tron**     | Tron, Tron Shasta                                                                                                                                                  |
| **Starknet** | Starknet, Starknet Sepolia                                                                                                                                         |
| **Stellar**  | Stellar, Stellar Testnet                                                                                                                                           |
| **Algorand** | Algorand                                                                                                                                                           |
| **Aptos**    | Aptos                                                                                                                                                              |

For a full list of chains and their providers, see [`doc/Providers.md`](doc/Providers.md).

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) >= 18
- [pnpm](https://pnpm.io/) >= 10
- [Redis](https://redis.io/) (used for API key management and caching)

### Installation

```bash
pnpm install
```

### Configuration

Copy the example environment file and fill in the values you need:

```bash
cp .env.example .env.local
```

All provider API keys are optional — only configure the chains you plan to use. See [`.env.example`](.env.example) for documentation on each variable.

### Running

```bash
# Development server (with hot reload)
pnpm dev

# Production build
pnpm build
pnpm start
```

The API will be available at `http://localhost:3000`.

## Testing

```bash
# Run unit tests
pnpm test:jest

# Run Bruno integration tests (against local server, started with env var TEST_ENV=true)
pnpm test:bruno:local
```

Tests use [Mock Service Worker (MSW)](https://mswjs.io/) to record and replay provider HTTP responses, so they can run without real API keys.

## Documentation

```bash
# Generate OpenAPI spec
pnpm doc:openapi

# Regenerate providers documentation
pnpm doc:providers

# Regenerate chains documentation
pnpm doc:chains
```

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Security

If you discover a security vulnerability, please follow our [security policy](SECURITY.md). Do **not** open a public issue.

## License

This project is licensed under the [Apache License 2.0](LICENSE). See the [NOTICE](NOTICE) file for additional attribution information.
