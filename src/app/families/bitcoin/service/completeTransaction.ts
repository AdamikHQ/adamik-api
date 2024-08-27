import coinSelect from "coinselect";
import split from "coinselect/split.js";
import { Transaction } from "~/app/model/types_WIP";
import { BtcService } from ".";
import { fetchFeePerByte, fetchXpubDashboard } from "../backend/explorer";
import { UtxoWithMetadata } from "../backend/types";
import { BitcoinTransactionParams, Xpub } from "../types";

async function completeTransaction(this: BtcService, transaction: Transaction): Promise<void> {
  let selectionAlgorithm = coinSelect;

  if (transaction.data.useMaxAmount) {
    selectionAlgorithm = split;
  }

  const feeRate = await fetchFeePerByte(this.chainId);

  // safe to cast here as we already validated sender in prevalidateTransaction
  const allUtxos = (await fetchXpubDashboard(this.chainId, transaction.data.sender as Xpub)).data[
    transaction.data.sender
  ].utxo;

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

  // .inputs and .outputs will be undefined if no solution was found
  if (!inputs || !outputs) {
    transaction.status.errors.push({
      message:
        "No solution found during UTXO selection, you might not have enough funds or an account that's too fragmented.",
    });
    return;
  }

  // write the inputs in the transaction for later encoding
  (transaction.data.params as BitcoinTransactionParams) = {
    inputs: [],
    outputs: [],
  };
  for (const input of inputs) {
    (transaction.data.params as BitcoinTransactionParams).inputs.push(input as UtxoWithMetadata);
  }

  for (const out of outputs) {
    // value in out is always defined after calling selectionAlgorithm
    if ("value" in out) {
      // in case useMaxAmount is true, we need to overwrite the amount in the transaction with the amount selected by the algorithm
      if ("address" in out) {
        if (transaction.data.useMaxAmount && out.address === transaction.data.recipient) {
          transaction.data.amount = BigInt(out.value);
        }
        (transaction.data.params as BitcoinTransactionParams).outputs.push(out);
      }
      // no address in the output, this is the change
      else {
        // Take the address of the first input, its as good as any other one
        // FIXME: terrible pratice, we should derive a new change address from the Xpub
        (transaction.data.params as BitcoinTransactionParams).outputs.push({
          value: out.value,
          address: (inputs[0] as UtxoWithMetadata).address,
        });
      }
    }
  }

  transaction.data.fees = BigInt(fee);
  transaction.data.params;
  // transaction.data.inputs = completeInputs; <== make it a params
}

export { completeTransaction };
