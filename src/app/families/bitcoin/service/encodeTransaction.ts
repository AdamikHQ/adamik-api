import { Psbt } from "bitcoinjs-lib";
import { Status, Transaction } from "~/app/model/types_WIP";
import { AdamikApiServerError } from "~/app/tools/handlers/errors";
import { fetchRawTransaction, fetchTransactionsMetadataBatched } from "../backend/blockchair";
import { BlockchairRawTransactionData } from "../backend/types";
import { getNetworkForChainId, isP2SHScript, isWitnessScript } from "../logic";
import { BitcoinService } from "../service";
import { BitcoinTransactionParams, PsbtInputExtended } from "../types";

async function encodeTransactionToSign(
  this: BitcoinService,
  _: { transaction: Transaction; status: Status }
): Promise<void> {
  const { transaction, status } = _;
  const params = transaction.data.params as BitcoinTransactionParams;
  const psbt = new Psbt({ network: getNetworkForChainId(this.chainId) });

  // Batch fetch all transaction metadata upfront
  const uniqueTransactionHashes = [...new Set(params.inputs.map((input) => input.transaction_hash))];
  const transactionsMetadata = await fetchTransactionsMetadataBatched(this.chainId, uniqueTransactionHashes);
  const rawTransactions = new Map<string, BlockchairRawTransactionData>(); // tx hash and raw tx string

  // Enrich selected inputs with data from the explorer
  // Note: This supports both confirmed and unconfirmed (mempool) inputs
  for (const [inputIndex, input] of params.inputs.entries()) {
    const transactionMetadata = transactionsMetadata.find(
      (metadata) => metadata.transaction.hash === input.transaction_hash
    );
    const outputScript = transactionMetadata?.outputs[input.index]?.script_hex;

    if (!outputScript || input.value == null) {
      throw new AdamikApiServerError(`Missing metadata for input ${inputIndex}`);
    }

    if (isWitnessScript(outputScript)) {
      psbt.addInput({
        hash: input.transaction_hash,
        index: input.index,
        witnessUtxo: {
          script: Buffer.from(outputScript, "hex"),
          value: input.value,
        },
      });
    } else {
      if (!rawTransactions.has(input.transaction_hash)) {
        const rawTransaction = await fetchRawTransaction(this.chainId, input.transaction_hash);
        rawTransactions.set(input.transaction_hash, rawTransaction);
      }

      const rawTransaction = rawTransactions.get(input.transaction_hash)!;
      let inputData: PsbtInputExtended = {
        hash: input.transaction_hash,
        index: input.index,
        nonWitnessUtxo: Buffer.from(rawTransaction.raw_transaction, "hex"),
      };

      if (isP2SHScript(outputScript)) {
        const decodedTx = rawTransaction.decoded_raw_transaction;
        const scriptSigHex = decodedTx?.vin?.[input.index]?.scriptSig?.hex;

        if (scriptSigHex && isWitnessScript(scriptSigHex)) {
          inputData.witnessUtxo = {
            script: Buffer.from(outputScript, "hex"),
            value: input.value,
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
