import { Psbt } from "bitcoinjs-lib";
import { BroadcastStatus } from "~/app/model/types_WIP";
import { BitcoinService } from ".";
import { postTransaction } from "../backend/explorer";

/**
 * Allows to broadcast a raw transaction, or a PSBT.
 *
 * TODO: make it explicit that it's a PSBT or raw hex?
 */
async function broadcastTransaction(
  this: BitcoinService,
  signedTransaction: string
): Promise<BroadcastStatus> {
  let transactionToBroadcast;

  // 70736274ff means that it's a raw PSBT instead of raw hex transaction: https://github.com/bitcoin/bips/blob/master/bip-0174.mediawiki#specification
  if (signedTransaction.startsWith("70736274ff")) {
    const psbt = Psbt.fromHex(signedTransaction);
    transactionToBroadcast = psbt.extractTransaction().toHex();
  } else {
    transactionToBroadcast = signedTransaction;
  }

  try {
    return {
      hash: await postTransaction(this.chainId, transactionToBroadcast),
    };
  } catch (e: any) {
    return {
      error: {
        message: e.message,
      },
    };
  }
}

export { broadcastTransaction };
