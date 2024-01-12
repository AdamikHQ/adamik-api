
##### TEST APP #####
OK - CSS
OK - React components
- split into a separate project & package.json

##### FEATURES #####
OK - send max
OK - get account state
OK - validate transaction
- Units (needs CAL)

##### UTILS #####
- easy and configurable caching of any network request
- logging / instrumentation / tracking
- test framework

##### CHAINS #####
WIP - cosmos
- evm
- utxo ?

##### ARCHI #####
KO - validateTransaction always calls validateTransactionIntent ?
- validateTransactionIntent is the same for all coins?

# transaction model
    - review all fields of all chains in Live

# advanced API
    - pubkeyToAddress: endpoint should take more param to set the key type to return (algorithm?, multisig?...)
