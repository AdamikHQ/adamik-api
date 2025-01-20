import { Status, Transaction, TransactionMode } from "~/app/model/types_WIP";
import { STARK_TOKEN_CONTRACT_ID } from "../constants";
import { ArgentX } from "../contracts/argentx";
import { estimateTransferFees, getNonce } from "../contracts/logic";

async function completeTransaction({
  transaction,
  status,
}: {
  transaction: Transaction;
  status: Status;
}): Promise<void> {
  switch (transaction.data.mode) {
    case TransactionMode.DEPLOY_WALLET_CONTRACT:
      switch (transaction.data.type) {
        case "argentX":
          const nonce = await getNonce(ArgentX.generateAddress(transaction.data.pubkey));
          transaction.data.nonce = BigInt(nonce);
          if (transaction.data.nonce !== 0n) {
            throw new Error("Nonce is not 0, can't deploy wallet contract");
          }
          transaction.data.fees = await ArgentX.estimateDeployFees(transaction.data.pubkey);
          break;
        default:
          break;
      }
      break;

    case TransactionMode.TRANSFER:
      if (!transaction.data.amount) {
        throw new Error("Amount is required");
      }

      transaction.data.fees = await estimateTransferFees(
        transaction.data.sender,
        transaction.data.recipient,
        transaction.data.amount,
        STARK_TOKEN_CONTRACT_ID
      );
      break;

    case TransactionMode.TRANSFER_TOKEN:
      if (!transaction.data.amount) {
        throw new Error("Amount is required");
      }

      transaction.data.fees = await estimateTransferFees(
        transaction.data.sender,
        transaction.data.recipient,
        transaction.data.amount,
        transaction.data.tokenId
      );
      break;
    default:
      break;
  }
}

export { completeTransaction };
