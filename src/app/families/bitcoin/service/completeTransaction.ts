import coinSelect from "coinselect";
import split from "coinselect/split.js";
import { CompleteTransaction, Transaction, TransactionMode } from "~/app/model/types_WIP";
import { BtcService } from ".";
import { fetchFeePerByte, fetchXpubDashboard } from "../backend/explorer";
import { UtxoWithMetadata } from "../backend/types";
import { Xpub } from "../types";

async function completeTransaction(this: BtcService, transaction: Transaction): Promise<CompleteTransaction> {
  let selectionAlgorithm = coinSelect;

  if (transaction.data.mode !== TransactionMode.TRANSFER) {
    // should never happen as it's already validated by zod
    transaction.status.errors.push({
      message: `Invalid transaction mode: ${transaction.data.mode} for chainId ${transaction.data.chainId}`,
    });
    return transaction as CompleteTransaction;
  }

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
    transaction.data.recipients.map((recipient) => {
      return {
        address: recipient.address,
        value: recipient.amount ? Number(recipient.amount) : undefined,
      };
    }),
    feeRate
  );

  // .inputs and .outputs will be undefined if no solution was found
  if (!inputs || !outputs) {
    transaction.status.errors.push({
      message:
        "No solution found during UTXO selection, you might not have enough funds or an account that's too fragmented.",
    });
    return transaction as CompleteTransaction;
  }

  const completeInputs = [];
  for (const input of inputs) {
    completeInputs.push(input as UtxoWithMetadata);
  }

  const completeRecipients: { address: string; amount: bigint }[] = [];
  for (const out of outputs) {
    // if address is not defined, it means it's a newly added recipient by coinselect (the change) that we need to reflect in the transaction
    if (!("address" in out)) {
      completeRecipients.push({
        // Take the address of the first input, its as good as any other one
        // FIXME: terrible pratice, we should derive a new change address from the Xpub
        address: (inputs[0] as UtxoWithMetadata).address,
        amount: BigInt(out.value),
      });
    } else if ("value" in out) {
      // if there is a value in the output, find the recipient that needs it (in case of calculated max amount) and reflect it in the transaction
      const recipientNeedingAmount = transaction.data.recipients.find((r) => r.address === out.address);

      if (recipientNeedingAmount) {
        completeRecipients.push({
          address: recipientNeedingAmount.address,
          amount: BigInt(out.value),
        });
      }
    }
  }

  return {
    ...transaction,
    data: {
      ...transaction.data,
      recipients: completeRecipients,
      inputs: completeInputs,
      fees: BigInt(fee),
    },
  };
}

export { completeTransaction };
