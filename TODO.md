
##### TEST APP #####
OK - CSS
OK - React components
- split into a separate project & package.json
- POC intégration ADAMIK dans Ledger Live ?

##### FEATURES #####
OK - send max
OK - get account state
OK - validate transaction
- Concept of family
- Units (needs CAL)
# ADVANCED
- chain-specific wrappers, on top of ADAMIK API
- multiple providers for each backend, as fallbacks

##### FRAMEWORK #####
- Review and address TODOs and FIXMEs !
- easy and configurable caching of any network request
- proper config (JSON)
- logging / instrumentation / tracking + review all console.xxx
- test framework
- proper error management : server errors, validation errors... + review all 'throw'
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
- modularization ? Families as independent modules

# transaction model
- review all fields of all chains in Live


##### API #####
- version in url !
- ChainId as path param --> enables running separate services for each chain, if needed
- merge path '/data/' into '/address/' ?
# ADVANCED
- pubkeyToAddress: endpoint should take more param to set the key type to return (algorithm?, multisig?...)

