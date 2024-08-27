import { Psbt } from "bitcoinjs-lib";
import { Transaction } from "~/app/model/types_WIP";
import { BtcService } from ".";
import { fetchRawTxMetadata, fetchTxMetadata } from "../backend/explorer";
import { BitcoinTransactionParams } from "../types";

async function encodeTransactionToSign(this: BtcService, transaction: Transaction): Promise<void> {
  const params = transaction.data.params as BitcoinTransactionParams;

  let psbt = new Psbt();

  // Enrich inputs from the explorer
  for (let inputIndex = 0; inputIndex < params.inputs.length; inputIndex++) {
    const input = params.inputs[inputIndex];
    const txMetadata = await fetchTxMetadata(this.chainId, input.transaction_hash);

    // FIXME: did I missunderstood the has_witness field?
    // TODO: Add link to documentation here
    if (!txMetadata[input.transaction_hash].has_witness) {
      psbt.addInput({
        ...input,
        hash: input.transaction_hash,
        witnessUtxo: {
          script: Buffer.from(txMetadata[input.transaction_hash].outputs[input.index].script_hex, "hex"),
          value: input.value,
        },
      });
    } else {
      const nonWitnessUtxo = (await fetchRawTxMetadata(this.chainId, input.transaction_hash))[
        input.transaction_hash
      ].raw_transaction;

      psbt.addInput({
        ...input,
        hash: input.transaction_hash,
        nonWitnessUtxo: Buffer.from(nonWitnessUtxo, "hex"),
      });
    }
    // activates RBF: https://github.com/bitcoin/bips/blob/master/bip-0125.mediawiki#summary
    // 0xfffffffd is stricly smaller than 0xffffffff - 1
    psbt.setInputSequence(inputIndex, 0xfffffffd);
  }

  psbt.addOutputs(params.outputs);

  transaction.encoded = psbt.toHex();
}

async function encodeTransactionToBroadcast(
  this: BtcService,
  signedTransaction: Transaction
): Promise<string> {
  if (!signedTransaction.signature) {
    throw new Error("missing transaction signature");
  }
  return signedTransaction.signature;
}

export { encodeTransactionToBroadcast, encodeTransactionToSign };
