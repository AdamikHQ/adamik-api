##### TEST APP #####
OK - CSS
OK - React components
- split into a separate project & package.json --> need API versioning first?
# Integrations
- POC intégration ADAMIK dans Ledger Live

##### FEATURES #####
OK - send max
OK - get account state
OK - validate transaction
- Concept of family
- Properly support large numbers with BigNumber.js
- Units (needs CAL)
- Need other data providers than Ledger explorers
# ADVANCED
- chain-specific wrappers, on top of ADAMIK API
- Rosetta wrapper ?
- multiple providers for each backend, as fallbacks
- enable/disable support of chains

##### FRAMEWORK #####
- Review and address TODOs and FIXMEs !
- easy and configurable caching of any network request
- proper config (JSON)
- logging / instrumentation / tracking + review all console.xxx
- test framework
- proper error management : server errors, validation errors... + review all 'throw' + use zod
- Dev / Staging / Prod envs
- Documentation strategy
  - API swagger
  - sequence diagrams of API flows
  - glossary
  - code documentation: comments + .md for design choices
- Use tooling on repo:
  - 'unimported'
  - 'dpdm'
  - 'depcheck'

##### CHAINS #####
WIP - cosmos + chains
- evm + chains
- utxo ?
- cosmos: use RPC instead of REST?

##### ARCHI #####
KO - validateTransaction always calls validateTransactionIntent ?
- validateTransactionIntent is the same for all coins?
- modularization ? Families as independent modules / libs

# transaction model
- review all fields of all chains in Live
- review all tx types of all chains in Live

##### API #####
OK - API key /!\ will be leaked through network tab --> need authentication too ? or allowed origins ?
- Rate limiting (https://stackoverflow.com/a/76968268/1160527)
- version in url !
OK - ChainId as path param --> enables running separate services for each chain, if needed
- merge path '/data/' into '/address/' ?
# ADVANCED
- pubkeyToAddress: endpoint should take more param to set the key type to return (algorithm?, multisig?...)

##### MAINTENANCE #####
- Update dependencies versions