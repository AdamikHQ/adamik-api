import { Psbt } from "bitcoinjs-lib";
import { Status, Transaction } from "~/app/model/types_WIP";
import { AdamikApiServerError } from "~/app/tools/handlers/errors";
import { fetchBatchTransactionMetadata, fetchRawTransactionMetadata } from "../backend/explorer";
import { getNetworkForChainId, isP2SHScript, isWitnessScript } from "../logic";
import { BitcoinService } from "../service";
import { BitcoinTransactionParams } from "../types";

// Helper functions
function createWitnessInput(input: any, outputScript: string, value: number) {
  return {
    hash: input.transaction_hash,
    index: input.index,
    witnessUtxo: {
      script: Buffer.from(outputScript, "hex"),
      value,
    },
  };
}

function createNonWitnessInput(input: any, rawTxData: any): any {
  if (typeof rawTxData === "string" && rawTxData.length > 0) {
    return {
      hash: input.transaction_hash,
      index: input.index,
      nonWitnessUtxo: Buffer.from(rawTxData, "hex"),
    };
  }

  if (!rawTxData?.data?.[input.transaction_hash]?.raw_transaction) {
    throw new AdamikApiServerError(
      `Missing or invalid raw transaction data for hash: ${input.transaction_hash}`
    );
  }

  return {
    hash: input.transaction_hash,
    index: input.index,
    nonWitnessUtxo: Buffer.from(rawTxData.data[input.transaction_hash].raw_transaction, "hex"),
  };
}

async function encodeTransactionToSign(
  this: BitcoinService,
  _: { transaction: Transaction; status: Status }
): Promise<void> {
  const { transaction, status } = _;
  const params = transaction.data.params as BitcoinTransactionParams;
  const psbt = new Psbt({ network: getNetworkForChainId(this.chainId) });

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
      throw new AdamikApiServerError(`Missing metadata for input ${inputIndex}`);
    }

    if (isWitnessScript(outputScript)) {
      psbt.addInput(createWitnessInput(input, outputScript, value));
    } else {
      if (!rawTxMetadataMap.has(input.transaction_hash)) {
        rawTxMetadataMap.set(
          input.transaction_hash,
          await fetchRawTransactionMetadata(this.chainId, input.transaction_hash)
        );
      }

      const rawTxData = rawTxMetadataMap.get(input.transaction_hash)!;
      let inputData = createNonWitnessInput(input, rawTxData);

      if (isP2SHScript(outputScript)) {
        const decodedTx = rawTxData.data?.[input.transaction_hash]?.decoded_raw_transaction;
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
          throw new AdamikApiServerError(`Missing scriptSig for P2SH input at index ${inputIndex}`);
        }
      }

      psbt.addInput(inputData);
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
    throw new AdamikApiServerError("missing transaction signature");
  }

  return signedTransaction.signature;
}

export { encodeTransactionToBroadcast, encodeTransactionToSign };
