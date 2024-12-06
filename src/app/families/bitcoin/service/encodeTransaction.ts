import { Psbt } from "bitcoinjs-lib";
import { Status, Transaction } from "~/app/model/types_WIP";
import { fetchRawTransactionMetadata, fetchTransactionMetadata } from "../backend/explorer";
import { getNetworkForChainId } from "../logic";
import { BitcoinService } from "../service";
import { BitcoinTransactionParams } from "../types";

async function encodeTransactionToSign(
  this: BitcoinService,
  _: { transaction: Transaction; status: Status }
): Promise<void> {
  const { transaction, status } = _;
  const params = transaction.data.params as BitcoinTransactionParams;

  let psbt = new Psbt({ network: getNetworkForChainId(this.chainId) });

  // Enrich inputs from the explorer
  // Note: This can use both confirmed and unconfirmed (mempool) transactions as inputs
  // Blockchair API returns mempool transactions with block_id = -1
  for (const [inputIndex, input] of params.inputs.entries()) {
    try {
      const txMetadata = await fetchTransactionMetadata(this.chainId, input.transaction_hash);
      const outputScript = txMetadata.outputs[input.index]?.script_hex;
      const value = input.value;

      if (!outputScript || value == null) {
        throw new Error(`Missing metadata for input ${inputIndex}`);
      }

      const isWitness = isWitnessScript(outputScript);

      if (isWitness) {
        psbt.addInput({
          hash: input.transaction_hash,
          index: input.index,
          witnessUtxo: {
            script: Buffer.from(outputScript, "hex"),
            value,
          },
        });
      } else if (isP2SH(outputScript)) {
        // Keep P2SH case separate as we might need special handling in the future:
        // - Detecting P2SH-wrapped SegWit programs
        // - Handling specific redeem script requirements
        // - Adding P2SH-specific signing logic
        const nonWitnessUtxo = await fetchRawTransactionMetadata(this.chainId, input.transaction_hash);
        psbt.addInput({
          hash: input.transaction_hash,
          index: input.index,
          nonWitnessUtxo: Buffer.from(nonWitnessUtxo, "hex"),
        });
      } else {
        const nonWitnessUtxo = await fetchRawTransactionMetadata(this.chainId, input.transaction_hash);
        psbt.addInput({
          hash: input.transaction_hash,
          index: input.index,
          nonWitnessUtxo: Buffer.from(nonWitnessUtxo, "hex"),
        });
      }

      // Enable RBF: https://github.com/bitcoin/bips/blob/master/bip-0125.mediawiki#summary
      // 0xfffffffd is stricly smaller than 0xffffffff - 1
      psbt.setInputSequence(inputIndex, 0xfffffffd);
    } catch (error: unknown) {
      console.error(`Failed to process input ${inputIndex}:`, error instanceof Error ? error.message : error);
      throw error;
    }
  }

  psbt.addOutputs(params.outputs);

  transaction.encoded = psbt.toHex();
}

async function encodeTransactionToBroadcast(
  this: BitcoinService,
  _: {
    signedTransaction: Transaction;
    status: Status;
  }
): Promise<string> {
  const { signedTransaction } = _;

  // useless check to make the compiler happy, zod already validated the fields
  if (!signedTransaction.signature) {
    throw new Error("missing transaction signature");
  }

  return signedTransaction.signature;
}

// Helper function to determine if a script is a witness program
function isWitnessScript(scriptHex: string): boolean {
  const script = Buffer.from(scriptHex, "hex");

  // Witness program: version 0 (P2WPKH/P2WSH) or version 1 (P2TR)
  // Format: OP_n (version) followed by a push of 20 or 32 bytes
  if (script.length === 22 && script[0] === 0x00 && script[1] === 0x14) {
    return true; // P2WPKH
  }
  if (script.length === 34 && script[0] === 0x00 && script[1] === 0x20) {
    return true; // P2WSH
  }
  if (script.length === 34 && script[0] === 0x51 && script[1] === 0x20) {
    return true; // P2TR (Taproot)
  }

  return false;
}

// Helper function to detect P2SH scripts
function isP2SH(scriptHex: string): boolean {
  const script = Buffer.from(scriptHex, "hex");
  return script.length === 23 && script[0] === 0xa9 && script[1] === 0x14 && script[22] === 0x87;
}

export { encodeTransactionToBroadcast, encodeTransactionToSign };
