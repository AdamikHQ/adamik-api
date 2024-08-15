import coinSelect from "coinselect";
import split from "coinselect/split.js";
import { isMultiRecipientTransaction, TransactionMode, TransactionWrapper } from "~/app/model/types_WIP";
import { BtcService } from ".";
import { fetchFeePerByte, fetchXpubDashboard } from "../backend/explorer";
import { UtxoWithMetadata } from "../backend/types";
import { Xpub } from "../types";

async function completeTransaction(this: BtcService, transaction: TransactionWrapper): Promise<void> {
  let selectionAlgorithm = coinSelect;

  if (!isMultiRecipientTransaction(transaction.data)) {
    if (transaction.data.mode !== TransactionMode.TRANSFER) {
      transaction.status.errors.push({
        message: `Invalid transaction mode: ${transaction.data.mode} for chainId ${transaction.data.chainId}`,
      });
      return;
    }

    if (!transaction.data.useMaxAmount === !transaction.data.amount) {
      transaction.status.errors.push({
        message: `Either one of the field "amount" or "userMaxAmount" is missing, or both are mistakenly set together for ${transaction.data.chainId}`,
      });
      return;
    }

    transaction.data = {
      chainId: transaction.data.chainId,
      mode: TransactionMode.TRANSFER_TO_MANY,
      sender: transaction.data.senders[0] as Xpub,
      recipients: [
        {
          address: transaction.data.recipients[0],
          amount: transaction.data.useMaxAmount ? undefined : transaction.data.amount,
        },
      ],
      inputs: [],
      fees: 0n,
    };
    selectionAlgorithm = split;
  }

  const feeRate = await fetchFeePerByte(this.chainId);

  const allUtxos = (await fetchXpubDashboard(this.chainId, transaction.data.sender)).data[
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
    return;
  }

  transaction.data.inputs = [];
  for (const input of inputs) {
    transaction.data.inputs.push(input as UtxoWithMetadata);
  }

  for (const out of outputs) {
    // if address is not defined, it means it's a newly added recipient by coinselect (the change) that we need to reflect in the transaction
    if (!("address" in out)) {
      transaction.data.recipients.push({
        // Take the address of the first input, its as good as any other one
        // FIXME: terrible pratice, we should derive a new change address from the Xpub
        address: (inputs[0] as UtxoWithMetadata).address,
        amount: BigInt(out.value),
      });
    } else {
      // if there is a value in the output, and there was no amount in the original recipient
      // => it means we are doing a spendAll transfer and should copy the calculated amount to the recipient
      const recipientNeedingAmount = transaction.data.recipients.find(
        (r) => r.address === out.address && !r.amount
      );
      if (recipientNeedingAmount && "value" in out) {
        recipientNeedingAmount.amount = BigInt(out.value);
      }
    }
  }
  transaction.data.fees = BigInt(fee);
}

export { completeTransaction };
