import coinSelect from "coinselect";
import split from "coinselect/split.js";
import { Transaction } from "~/app/model/types_WIP";
import { BitcoinService } from ".";
import { fetchFeePerByte, fetchXpubDashboard } from "../backend/explorer";
import { UtxoWithMetadata } from "../backend/types";
import { BitcoinTransactionParams, Xpub } from "../types";

async function completeTransaction(this: BitcoinService, transaction: Transaction): Promise<void> {
  const feeRate = await fetchFeePerByte(this.chainId);

  // safe to cast here as we already validated sender in prevalidateTransaction
  const allUtxos = (await fetchXpubDashboard(this.chainId, transaction.data.sender as Xpub)).data[
    transaction.data.sender
  ].utxo;

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

  // .inputs and .outputs will be undefined if no solution was found
  if (!inputs || !outputs) {
    transaction.status.errors.push({
      message:
        "No solution found during UTXO selection, you might not have enough funds or an account that's too fragmented.",
    });
    return;
  }

  // Store inputs and outputs in the transaction, as they'll be needed later to encode it
  const params = {
    inputs: [],
    outputs: [],
  } as BitcoinTransactionParams;

  for (const input of inputs) {
    params.inputs.push(input as UtxoWithMetadata);
  }

  for (const out of outputs) {
    // value in out is always defined after calling selectionAlgorithm
    if ("value" in out) {
      // in case useMaxAmount is true, we need to overwrite the amount in the transaction with the amount selected by the algorithm
      if ("address" in out) {
        if (transaction.data.useMaxAmount && out.address === transaction.data.recipient) {
          transaction.data.amount = BigInt(out.value);
        }
        params.outputs.push(out);
      }
      // no address in the output, this is the change
      else {
        // Take the address of the first input, its as good as any other one
        // FIXME Not compliant with Bitcoin spec, ideally a new change address should be derived from the Xpub
        params.outputs.push({
          value: out.value,
          address: (inputs[0] as UtxoWithMetadata).address,
        });
      }
    }
  }

  transaction.data.fees = BigInt(fee);
  transaction.data.params = params;
}

export { completeTransaction };
