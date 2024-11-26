import coinSelect from "coinselect";
import split from "coinselect/split.js";
import { Status, Transaction } from "~/app/model/types_WIP";
import { fetchAddressesDashboard, fetchFeePerByte, fetchXpubDashboard } from "../backend/explorer";
import { UtxoWithMetadata } from "../backend/types";
import { isValidXpub } from "../logic";
import { BitcoinService } from "../service";
import { BitcoinTransactionParams } from "../types";

async function completeTransaction(
  this: BitcoinService,
  _: {
    transaction: Transaction;
    status: Status;
  }
): Promise<void> {
  const { transaction, status } = _;

  const feeRate = await fetchFeePerByte(this.chainId);

  // safe to cast here as we already validated sender in prevalidateTransaction
  const allUtxos = isValidXpub(this.chainId, transaction.data.sender)
    ? (await fetchXpubDashboard(this.chainId, transaction.data.sender)).data[transaction.data.sender].utxo
    : (await fetchAddressesDashboard(this.chainId, [transaction.data.sender])).data?.utxo;

  // Get current block height from the appropriate dashboard
  const blockHeightResponse = isValidXpub(this.chainId, transaction.data.sender)
    ? await fetchXpubDashboard(this.chainId, transaction.data.sender)
    : await fetchAddressesDashboard(this.chainId, [transaction.data.sender]);

  if (!blockHeightResponse.context.state) {
    console.warn(
      `completeTransaction - missing current block height: ${JSON.stringify(blockHeightResponse)}`
    );
    throw new Error(`fetchNetworkInformations - error: missing current block height`);
  }
  const currentBlockHeight = blockHeightResponse.context.state;

  const selectionAlgorithm = transaction.data.useMaxAmount ? split : coinSelect;
  const { inputs, outputs, fee } = selectionAlgorithm(
    allUtxos ?? [],
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
    status.errors.push({
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

  // Check selected UTXOs and add warnings
  for (const input of inputs) {
    const utxo = input as UtxoWithMetadata;
    params.inputs.push(utxo);

    // Case 1: UTXO is in mempool (block_id = -1)
    if (utxo.block_id === -1) {
      status.warnings.push({
        message: `Using unconfirmed input from transaction ${utxo.transaction_hash} (still pending in mempool)`,
      });
    }
    // Case 2: UTXO is in a block but has < 6 confirmations
    else if (utxo.block_id > 0) {
      const confirmations = currentBlockHeight - utxo.block_id + 1;
      if (confirmations < 6) {
        status.warnings.push({
          message: `Using input from transaction ${
            utxo.transaction_hash
          } with only ${confirmations} confirmation${confirmations === 1 ? "" : "s"}`,
        });
      }
    }
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
