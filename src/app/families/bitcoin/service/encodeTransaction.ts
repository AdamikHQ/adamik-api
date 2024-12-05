import { Psbt } from "bitcoinjs-lib";
import { ChainId, Status, Transaction } from "~/app/model/types_WIP";
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
  for (const input of params.inputs) {
    // - BTC addresses are segwit-compatible if their type is not "legacy"
    // - Legacy addresses all start with '1'
    // - Only Bitcoin supports SegWit
    // https://bitcoin.design/guide/glossary/address/
    const isSegwitInput =
      (this.chainId === ChainId.BITCOIN || this.chainId === ChainId.BITCOIN_TESTNET) &&
      !input.address.startsWith("1");

    if (isSegwitInput) {
      const txMetadata = await fetchTransactionMetadata(this.chainId, input.transaction_hash);
      psbt.addInput({
        ...input,
        hash: input.transaction_hash,
        witnessUtxo: {
          script: Buffer.from(txMetadata.outputs[input.index].script_hex, "hex"),
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
    psbt.setInputSequence(input.index, 0xfffffffd);
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

export { encodeTransactionToBroadcast, encodeTransactionToSign };
