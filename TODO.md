
##### TEST APP #####
OK - CSS
OK - React components
- split into a separate project & package.json

##### FEATURES #####
OK - send max
OK - get account state
OK - validate transaction
- Units (needs CAL)

##### FRAMEWORK #####
- Review and address TODOs and FIXMEs !
- easy and configurable caching of any network request
- logging / instrumentation / tracking + review all console.xxx
- test framework
- proper error management : server errors, validation errors... + review all 'throw'
- Dev / Staging / Prod envs
- Use tooling on repo:
  - 'unimported'
  - 'dpdm'
  - 'depcheck'

##### CHAINS #####
WIP - cosmos
- evm
- utxo ?

##### ARCHI #####
KO - validateTransaction always calls validateTransactionIntent ?
- validateTransactionIntent is the same for all coins?
- modularization ? Families as independent modules

# transaction model
    - review all fields of all chains in Live

# advanced API
    - pubkeyToAddress: endpoint should take more param to set the key type to return (algorithm?, multisig?...)
