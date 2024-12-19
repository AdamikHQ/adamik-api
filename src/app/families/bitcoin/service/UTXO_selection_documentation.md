# UTXO Selection Strategy

This document explains how UTXOs (Unspent Transaction Outputs) are selected when creating Bitcoin transactions in Adamik.

## Overview

We use the `coinselect` library which provides two different algorithms depending on the use case:

- `coinSelect`: For sending specific amounts
- `split`: For sending maximum available amount ("Send Max")

## Main Algorithm (coinSelect)

### How it works

The algorithm uses a "blackjack" strategy to select UTXOs when sending a specific amount:

1. Accumulates inputs until it has just enough to cover the target amount plus fees
2. Tries to minimize the number of inputs to reduce transaction size and fees
3. Creates change outputs when necessary, avoiding dust amounts

```typescript
const { inputs, outputs, fee } = coinSelect(availableUtxos, [{ address: recipient, value: amount }], feeRate);
```

### Benefits

- Optimizes for lower transaction fees by minimizing inputs
- Handles change output creation automatically
- Avoids creating dust outputs
- Simple and battle-tested implementation

### Limitations

1. **No Confirmation Status Consideration**

   - UTXOs are selected purely based on their value
   - Unconfirmed or recently confirmed UTXOs might be selected even when older confirmed ones are available
   - The code only adds warnings after selection:
     ```typescript
     if (utxo.block_id === -1) {
       status.warnings.push({
         message: "Using unconfirmed input...",
       });
     }
     ```

2. **Change Address Strategy**
   - Currently uses the first input's address as change address
   - Not fully compliant with Bitcoin best practices
   - As noted in the code:
     ```typescript
     // FIXME Not compliant with Bitcoin spec, ideally a new change
     // address should be derived from the Xpub
     ```

## Maximum Amount Algorithm (split)

When sending the maximum available amount, we use the `split` algorithm which:

1. Takes all available UTXOs as inputs
2. Creates a single output with the maximum possible value (total inputs minus fees)
3. No change output is created

## Potential Improvements

1. **UTXO Selection Criteria**

   - Pre-filter UTXOs based on confirmation status before selection
   - Or modify the selection algorithm to prefer confirmed UTXOs
   - Could add a "conservative mode" that only uses well-confirmed UTXOs

2. **Change Address Management**

   - Implement proper change address derivation for HD wallets
   - Use a new change address for each transaction
   - Consider privacy implications of change address reuse

3. **Advanced Features**
   - Coin control (manual UTXO selection)
   - UTXO consolidation strategies
   - Privacy-focused selection strategies (avoiding address reuse, etc.)

## Current Implementation

The selection happens in `completeTransaction.ts`:

```typescript
const selectionAlgorithm = transaction.data.useMaxAmount ? split : coinSelect;
const { inputs, outputs, fee } = selectionAlgorithm(
  allUtxos,
  [
    {
      address: transaction.data.recipient,
      value: transaction.data.amount ? Number(transaction.data.amount) : undefined,
    },
  ],
  feeRate
);
```

After selection, the code:

1. Validates the solution exists
2. Checks confirmation status and adds warnings if:
   - UTXO is unconfirmed (in mempool)
   - UTXO has fewer confirmations than required
3. Handles change outputs
4. Updates transaction parameters

## References

- [coinselect npm package](https://www.npmjs.com/package/coinselect)
- [Bitcoin UTXO management best practices](https://bitcoin.org/en/transactions-guide#change-addresses)
