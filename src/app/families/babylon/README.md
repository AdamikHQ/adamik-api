# Babylon Integration

This folder contains specialized logic for supporting Babylon Staking, a unique feature that bridges Bitcoin and Cosmos blockchains. Unlike other folders in the `families` directory, this is not a standalone blockchain implementation of `BaseChainService`.

## Key Differences

- **Not a Full Chain Implementation**: While other folders in `families` contain complete implementations of `BaseChainService`, this folder only contains supplementary logic.
- **Cross-Chain Integration**: The code here works in conjunction with both Bitcoin and Cosmos families to enable Babylon Staking functionality.
- **Specialized Staking Logic**: Contains specific logic for creating staking transactions and getting data about staking parameters and positions

## Main Components

- `logic.ts` - Contains specific logic for:

  - Creating the bitcoin PSBTs and transactions to stake and unstake bitcoins
  - Creating the babylon registration message for the cosmos chain

- `backend/babylonAPI.ts` - Contains the integration of the Babylon staking API backend for:
  - Fetching staking parameters and network information
  - Retrieving finality providers (validators) data
  - Querying delegation information for staking positions

## Dependencies

This implementation relies on:

- Bitcoin family implementation for UTXO management and transaction handling
- Cosmos family implementation for Babylon chain interactions
- Babylon-specific libraries and protocols
