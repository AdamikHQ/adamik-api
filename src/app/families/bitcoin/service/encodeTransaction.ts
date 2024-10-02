import { Psbt } from "bitcoinjs-lib";
import { Transaction } from "~/app/model/types_WIP";
import { BitcoinService } from ".";
import { fetchRawTransactionMetadata, fetchTransactionMetadata } from "../backend/explorer";
import { selectNetworkForChainId } from "../logic";
import { BitcoinTransactionParams } from "../types";

async function encodeTransactionToSign(this: BitcoinService, transaction: Transaction): Promise<void> {
  const params = transaction.data.params as BitcoinTransactionParams;

  let psbt = new Psbt({ network: selectNetworkForChainId(this.chainId) });

  // Enrich inputs from the explorer
  for (let inputIndex = 0; inputIndex < params.inputs.length; inputIndex++) {
    const input = params.inputs[inputIndex];
    const txMetadata = await fetchTransactionMetadata(this.chainId, input.transaction_hash);

    // FIXME: did I misunderstand the has_witness field?
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
      const nonWitnessUtxo = (await fetchRawTransactionMetadata(this.chainId, input.transaction_hash))[
        input.transaction_hash
      ].raw_transaction;

      psbt.addInput({
        ...input,
        hash: input.transaction_hash,
        nonWitnessUtxo: Buffer.from(nonWitnessUtxo, "hex"),
      });
    }
    // Enables RBF: https://github.com/bitcoin/bips/blob/master/bip-0125.mediawiki#summary
    // 0xfffffffd is stricly smaller than 0xffffffff - 1
    psbt.setInputSequence(inputIndex, 0xfffffffd);
  }

  psbt.addOutputs(params.outputs);

  transaction.encoded = psbt.toHex();
}

async function encodeTransactionToBroadcast(
  this: BitcoinService,
  signedTransaction: Transaction
): Promise<string> {
  // useless check to make the compiler happy, zod already validated the fields
  if (!signedTransaction.signature) {
    throw new Error("missing transaction signature");
  }
  return signedTransaction.signature;
}

export { encodeTransactionToBroadcast, encodeTransactionToSign };
