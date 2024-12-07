import { Psbt } from "bitcoinjs-lib";
import { Status, Transaction } from "~/app/model/types_WIP";
import { fetchBatchTransactionMetadata, fetchRawTransactionMetadata } from "../backend/explorer";
import { getNetworkForChainId } from "../logic";
import { BitcoinService } from "../service";
import { BitcoinTransactionParams } from "../types";

async function encodeTransactionToSign(
  this: BitcoinService,
  _: { transaction: Transaction; status: Status }
): Promise<void> {
  const { transaction, status } = _;
  const params = transaction.data.params as BitcoinTransactionParams;
  const psbt = new Psbt({ network: getNetworkForChainId(this.chainId) });

  try {
    // Batch fetch all transaction metadata upfront
    const uniqueTransactionHashes = [...new Set(params.inputs.map((input) => input.transaction_hash))];
    const txMetadataMap = await fetchBatchTransactionMetadata(this.chainId, uniqueTransactionHashes);
    const rawTxMetadataMap = new Map();

    // Enrich inputs from the explorer
    // Note: This can use both confirmed and unconfirmed (mempool) transactions as inputs
    // Blockchair API returns mempool transactions with block_id = -1
    for (const [inputIndex, input] of params.inputs.entries()) {
      const txMetadata = txMetadataMap[input.transaction_hash];
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
        if (!rawTxMetadataMap.has(input.transaction_hash)) {
          rawTxMetadataMap.set(
            input.transaction_hash,
            await fetchRawTransactionMetadata(this.chainId, input.transaction_hash)
          );
        }

        const rawTxData = rawTxMetadataMap.get(input.transaction_hash)!;

        let inputData: any;
        if (typeof rawTxData === "string" && rawTxData.length > 0) {
          inputData = {
            hash: input.transaction_hash,
            index: input.index,
            nonWitnessUtxo: Buffer.from(rawTxData, "hex"),
          };
        } else if (rawTxData?.data?.[input.transaction_hash]?.raw_transaction) {
          inputData = {
            hash: input.transaction_hash,
            index: input.index,
            nonWitnessUtxo: Buffer.from(rawTxData.data[input.transaction_hash].raw_transaction, "hex"),
          };

          if (isP2SH(outputScript)) {
            const decodedTx = rawTxData.data[input.transaction_hash].decoded_raw_transaction;
            const scriptSigHex = decodedTx?.vin?.[input.index]?.scriptSig?.hex;

            if (scriptSigHex && isWitnessScript(scriptSigHex)) {
              inputData.witnessUtxo = {
                script: Buffer.from(outputScript, "hex"),
                value,
              };
              inputData.redeemScript = Buffer.from(scriptSigHex, "hex");
            } else if (scriptSigHex) {
              inputData.redeemScript = Buffer.from(scriptSigHex, "hex");
            } else {
              throw new Error(`Missing scriptSig for P2SH input at index ${inputIndex}`);
            }
          }
        } else {
          throw new Error(`Missing or invalid raw transaction data for hash: ${input.transaction_hash}`);
        }

        if (!inputData) {
          throw new Error(`Failed to create input data for hash: ${input.transaction_hash}`);
        }

        psbt.addInput(inputData);
      } else {
        if (!rawTxMetadataMap.has(input.transaction_hash)) {
          rawTxMetadataMap.set(
            input.transaction_hash,
            await fetchRawTransactionMetadata(this.chainId, input.transaction_hash)
          );
        }

        const rawTxData = rawTxMetadataMap.get(input.transaction_hash)!;

        let inputData: any;
        if (typeof rawTxData === "string" && rawTxData.length > 0) {
          inputData = {
            hash: input.transaction_hash,
            index: input.index,
            nonWitnessUtxo: Buffer.from(rawTxData, "hex"),
          };
        } else if (rawTxData?.data?.[input.transaction_hash]?.raw_transaction) {
          inputData = {
            hash: input.transaction_hash,
            index: input.index,
            nonWitnessUtxo: Buffer.from(rawTxData.data[input.transaction_hash].raw_transaction, "hex"),
          };

          if (isP2SH(outputScript)) {
            const decodedTx = rawTxData.data[input.transaction_hash].decoded_raw_transaction;
            const scriptSigHex = decodedTx?.vin?.[input.index]?.scriptSig?.hex;

            if (scriptSigHex && isWitnessScript(scriptSigHex)) {
              inputData.witnessUtxo = {
                script: Buffer.from(outputScript, "hex"),
                value,
              };
              inputData.redeemScript = Buffer.from(scriptSigHex, "hex");
            } else if (scriptSigHex) {
              inputData.redeemScript = Buffer.from(scriptSigHex, "hex");
            } else {
              throw new Error(`Missing scriptSig for P2SH input at index ${inputIndex}`);
            }
          }
        } else {
          throw new Error(`Missing or invalid raw transaction data for hash: ${input.transaction_hash}`);
        }

        if (!inputData) {
          throw new Error(`Failed to create input data for hash: ${input.transaction_hash}`);
        }

        psbt.addInput(inputData);
      }

      // Enable RBF: https://github.com/bitcoin/bips/blob/master/bip-0125.mediawiki#summary
      // 0xfffffffd is stricly smaller than 0xffffffff - 1
      psbt.setInputSequence(inputIndex, 0xfffffffd);
    }

    psbt.addOutputs(params.outputs);
    transaction.encoded = psbt.toHex();
  } catch (error: unknown) {
    console.error("Failed to encode transaction:", error instanceof Error ? error.message : error);
    throw error;
  }
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
