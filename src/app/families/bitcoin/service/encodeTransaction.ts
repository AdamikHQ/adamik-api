import { Psbt } from "bitcoinjs-lib";
import { Status, Transaction } from "~/app/model/types_WIP";
import { fetchRawTransactionMetadata, fetchTransactionMetadata } from "../backend/explorer";
import { getNetworkForChainId } from "../logic";
import { BitcoinService } from "../service";
import { BitcoinTransactionParams } from "../types";

async function encodeTransactionToSign(
  this: BitcoinService,
  _: {
    transaction: Transaction;
    status: Status;
  }
): Promise<void> {
  const { transaction, status } = _;

  const params = transaction.data.params as BitcoinTransactionParams;

  let psbt = new Psbt({ network: getNetworkForChainId(this.chainId) });

  // Enrich inputs from the explorer
  // Note: This can use both confirmed and unconfirmed (mempool) transactions as inputs
  // Blockchair API returns mempool transactions with block_id = -1
  for (const [inputIndex, input] of params.inputs.entries()) {
    // - BTC addresses are segwit-compatible if their type is not "legacy"
    // - Legacy addresses all start with '1'
    // - Only Bitcoin supports SegWit
    // https://bitcoin.design/guide/glossary/address/
    const txMetadata = await fetchTransactionMetadata(this.chainId, input.transaction_hash);
    const outputScript = txMetadata.outputs[input.index].script_hex;
    const isWitnessInput = isWitnessScript(outputScript);

    if (isWitnessInput) {
      psbt.addInput({
        ...input,
        hash: input.transaction_hash,
        witnessUtxo: {
          script: Buffer.from(outputScript, "hex"),
          value: input.value,
        },
      });
    } else {
      const nonWitnessUtxo = await fetchRawTransactionMetadata(this.chainId, input.transaction_hash);
      psbt.addInput({
        ...input,
        hash: input.transaction_hash,
        nonWitnessUtxo: Buffer.from(nonWitnessUtxo, "hex"),
      });
    }

    // Enable RBF: https://github.com/bitcoin/bips/blob/master/bip-0125.mediawiki#summary
    // 0xfffffffd is stricly smaller than 0xffffffff - 1
    psbt.setInputSequence(inputIndex, 0xfffffffd);
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

  // P2SH-wrapped witness programs
  if (script.length === 23 && script[0] === 0xa9 && script[1] === 0x14 && script[22] === 0x87) {
    return true; // P2SH (might contain a witness program)
  }

  return false;
}

export { encodeTransactionToBroadcast, encodeTransactionToSign };
