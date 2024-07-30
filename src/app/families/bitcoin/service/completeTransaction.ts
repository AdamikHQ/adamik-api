import coinSelect from "coinselect";
import { transactionDataSchema } from "~/app/api/schemaCommon";
import { isMultiRecipientTransaction, TransactionWrapper } from "~/app/model/types_WIP";
import { BtcService } from ".";
import { fetchFeePerByte, fetchXpubData } from "../backend/explorer";
import { UtxoWithMetadata } from "../backend/types";

async function completeTransaction(this: BtcService, transaction: TransactionWrapper): Promise<void> {
  /**
   * This should never happen because the transaction is already validated by zod
   * @see {@link transactionDataSchema.refine} at the {@link transactionDataSchema} definition
   * TODO: maybe we could make sure that completeTransaction directly receives a multi-recipient transaction ?
   */
  if (!isMultiRecipientTransaction(transaction.data)) {
    throw new Error(`Something went wrong, the transaction is not a multi-recipient transaction.`);
  }

  const feeRate = await fetchFeePerByte(this.chainId);

  const allUtxos = (await fetchXpubData(this.chainId, transaction.data.sender)).data[transaction.data.sender]
    .utxo;

  const { inputs, outputs, fee } = coinSelect(
    allUtxos,
    transaction.data.recipients.map((recipient) => {
      return {
        address: recipient.address,
        value: Number(recipient.amount),
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

  // if change is required, add the change address of the sender as the latest recipient
  for (const out of outputs) {
    // if address is not defined, it's a newly added change by coinselect
    if (!out.address) {
      transaction.data.recipients.push({
        // Take the address of the first input, its as good as any other one
        // FIXME: terrible pratice, we should derive a new change address.
        address: (inputs[0] as UtxoWithMetadata).address,
        amount: BigInt(out.value),
      });
    }
  }
  transaction.data.fees = BigInt(fee);
}

export { completeTransaction };
