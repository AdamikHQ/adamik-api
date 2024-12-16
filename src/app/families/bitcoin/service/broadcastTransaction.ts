import { Psbt } from "bitcoinjs-lib";
import { postTransaction } from "../backend/explorer";
import { BitcoinService } from "../service";

/**
 * Allows to broadcast a raw transaction, or a PSBT.
 *
 * TODO: make it explicit that it's a PSBT or raw hex?
 */
async function broadcastTransaction(this: BitcoinService, signedTransaction: string): Promise<string> {
  let transactionToBroadcast;

  // 70736274ff means that it's a raw PSBT instead of raw hex transaction: https://github.com/bitcoin/bips/blob/master/bip-0174.mediawiki#specification
  if (signedTransaction.startsWith("70736274ff")) {
    const psbt = Psbt.fromHex(signedTransaction);
    transactionToBroadcast = psbt.extractTransaction().toHex();
  } else {
    transactionToBroadcast = signedTransaction;
  }

  return await postTransaction(this.chainId, transactionToBroadcast);
}

export { broadcastTransaction };
