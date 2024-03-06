## TEST APP
- [x] CSS
- [x] Split React components
- [ ] Split into a separate project & package.json --> need API versioning first?
#### Integrations
- [ ] POC integration of ADAMIK in Ledger Live

## FEATURES
- [x] send max
- [x] get account state
- [x] validate transaction
- [ ] Concept of family
- [ ] Staking (cosmos)
- [ ] Tokens (evm + algorand)
- [ ] Properly support large numbers with BigNumber.js
- [x] Units (needs CAL)
- [ ] Need other data providers than Ledger explorers
#### ADVANCED
- [ ] chain-specific wrappers, on top of ADAMIK API (e.g EVM?)
- [ ] Rosetta wrapper ?
- [ ] multiple data providers for each chain, as fallbacks
- [ ] enable/disable support of chains

## FRAMEWORK
- [ ] Review and address TODOs and FIXMEs !
- [ ] proper error management : server errors, validation errors... + review all 'throw' + use zod
- [ ] easy and configurable caching of any network request
- [ ] proper config (JSON ?)
- [ ] logging / instrumentation / tracking + review all console.xxx
- [ ] test framework
- [ ] Dev / Staging / Prod envs
- [ ] Documentation strategy
  - [ ] API swagger
  - [ ] sequence diagrams of API flows
  - [ ] glossary
  - [ ] code documentation: comments + .md for design choices
- [ ] Use tooling on repo:
  - [ ] 'unimported'
  - [ ] 'dpdm'
  - [ ] 'depcheck'

## CHAINS
- [x] algorand
- [ ] cosmos + chains
  - [ ] ~~cosmos: use RPC instead of REST?~~
- [ ] evm + chains
- [ ] utxo ?

## ARCHI
- [ ] ~~validateTransaction always calls validateTransactionIntent ?~~
- [ ] validateTransactionIntent is the same for all coins?
- [ ] modularization ? Families as independent modules / libs
### transaction model
- [ ] review & consolidate all fields of all chains in Live
- [ ] review & consolidate all tx types of all chains in Live

## API
- [x] API key /!\ will be leaked through network tab --> need authentication too ? or allowed origins ?
- [ ] Rate limiting (https://stackoverflow.com/a/76968268/1160527)
- [ ] version in url !
- [x] ChainId as path param
- [ ] merge path '/data/' into '/address/' ?
#### ADVANCED
- [ ] pubkeyToAddress: endpoint should take more param to set the key type to return (algorithm?, multisig?...)

## MAINTENANCE
- [ ] Update dependencies versions
