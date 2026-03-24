# Contributing to Adamik API

Thank you for your interest in contributing! This guide will help you get started.

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## How to Contribute

### Reporting Bugs

- Search [existing issues](https://github.com/AdamikHQ/adamik-api/issues) first to avoid duplicates.
- Open a new issue with a clear title and description, including steps to reproduce, expected behavior, and actual behavior.

### Suggesting Features

- Open an issue describing the feature, the problem it solves, and any alternatives you've considered.

### Submitting Changes

1. Fork the repository and create a branch from `main`.
2. Install dependencies with `pnpm install`.
3. Make your changes, following the coding conventions below.
4. Run tests to make sure nothing is broken: `pnpm test:jest`.
5. Run the linter: `pnpm lint`.
6. Commit your changes with a clear, descriptive message.
7. Open a pull request against `main`.

### Adding a New Chain

See the step-by-step guides in [`doc/HOWTO/`](doc/HOWTO/):

- [Add an EVM chain](doc/HOWTO/AddEvmChains.md)
- [Add a Cosmos chain](doc/HOWTO/AddCosmosChains.md)
- [Add a Bitcoin-family chain](doc/HOWTO/AddBitcoinChains.md)

## Development Setup

```bash
# Install dependencies
pnpm install

# Copy environment config
cp .env.example .env.local

# Start development server
pnpm dev

# Run tests
pnpm test:jest
```

## Coding Conventions

- **TypeScript** — all source code is in TypeScript with strict mode enabled.
- **Formatting** — the project uses ESLint and Prettier. Run `pnpm lint` before committing.
- **Environment variables** — never hardcode secrets. All environment variables must be declared in `src/env.ts` and documented in `.env.example`.
- **Tests** — use Jest with MSW for mocking HTTP responses. Mock files live in `src/tests/mocks/`.

## License

By contributing, you agree that your contributions will be licensed under the [Apache License 2.0](LICENSE).
