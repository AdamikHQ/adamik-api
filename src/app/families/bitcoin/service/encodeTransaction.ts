import { Psbt } from "bitcoinjs-lib";
import { isMultiRecipientTransaction, TransactionWrapper } from "~/app/model/types_WIP";
import { BtcService } from ".";
import { fetchRawTxMetadata, fetchTxMetadata } from "../backend/explorer";

async function encodeTransactionToSign(this: BtcService, transaction: TransactionWrapper): Promise<void> {
  /**
   * This should never happen because the transaction is already validated by zod
   * @see {@link transactionDataSchema.refine} at the {@link transactionDataSchema} definition
   * TODO: maybe we could make sure that completeTransaction directly receives a multi-recipient transaction ?
   */
  if (!isMultiRecipientTransaction(transaction.data)) {
    throw new Error(`Something went wrong, the transaction is not a multi-recipient transaction.`);
  }

  if (!transaction.data.inputs || transaction.data.inputs.length === 0) {
    // should not happen as the transaction is already passed through completeTransaction
    throw new Error(`Something went wrong, the transaction has no inputs.`);
  }

  let psbt = new Psbt();

  // Enrich inputs from the explorer
  await Promise.all(
    transaction.data.inputs.map(async (input, inputIndex) => {
      const txMetadata = await fetchTxMetadata(this.chainId, input.transaction_hash);

      // FIXME: did I missunderstood the has_witness field?
      // TODO: Add link to documentation here
      if (!txMetadata[input.transaction_hash].has_witness) {
        psbt.addInput({
          hash: input.transaction_hash,
          witnessUtxo: {
            script: Buffer.from(txMetadata[input.transaction_hash].outputs[input.index].script_hex, "hex"),
            value: input.value,
          },
          ...input,
        });
      } else {
        const nonWitnessUtxo = (await fetchRawTxMetadata(this.chainId, input.transaction_hash))[
          input.transaction_hash
        ].raw_transaction;

        psbt.addInput({
          hash: input.transaction_hash,
          nonWitnessUtxo: Buffer.from(nonWitnessUtxo, "hex"),
          ...input,
        });
      }
      // activates RBF: https://github.com/bitcoin/bips/blob/master/bip-0125.mediawiki#summary
      // 0xfffffffd is stricly smaller than 0xffffffff - 1
      psbt.setInputSequence(inputIndex, 0xfffffffd);
    })
  );

  for (const recipient of transaction.data.recipients) {
    psbt.addOutput({
      address: recipient.address,
      value: Number(recipient.amount),
    });
  }

  transaction.encoded = psbt.toHex();
}

async function encodeTransactionToBroadcast(
  this: BtcService,
  signedTransaction: TransactionWrapper
): Promise<string> {
  if (!signedTransaction.signature) {
    throw new Error("missing transaction signature");
  }
  return signedTransaction.signature;
}

export { encodeTransactionToBroadcast, encodeTransactionToSign };
