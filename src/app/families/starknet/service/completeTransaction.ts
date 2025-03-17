import { DeployContractType, Status, Transaction, TransactionMode } from "~/app/model/types_WIP";
import { UserInputError } from "~/app/tools/handlers/errors";
import { estimateTransferFees, getNonce } from "../backend/node";
import { STARK_TOKEN_CONTRACT_ID } from "../constants";
import { ArgentX } from "../contracts/argentx";
import { extractX } from "../logic";

async function completeTransaction({
  transaction,
  status,
}: {
  transaction: Transaction;
  status: Status;
}): Promise<void> {
  if (transaction.data.senderPubKey) {
    transaction.data.senderPubKey = extractX(transaction.data.senderPubKey);
  }

  switch (transaction.data.mode) {
    case TransactionMode.DEPLOY_ACCOUNT:
      switch (transaction.data.contractType) {
        case DeployContractType.ARGENTX:
          const nonce = await getNonce(ArgentX.generateAddress(transaction.data.senderPubKey));
          transaction.data.nonce = BigInt(nonce);
          if (transaction.data.nonce !== 0n) {
            throw new UserInputError("Nonce is not 0, can't deploy wallet contract");
          }
          transaction.data.fees = await ArgentX.estimateDeployFees(transaction.data.senderPubKey);
          break;
        default:
          break;
      }
      break;

    case TransactionMode.TRANSFER:
      if (!transaction.data.amount) {
        throw new UserInputError("Amount is required");
      }

      transaction.data.fees = await estimateTransferFees(
        transaction.data.senderAddress,
        transaction.data.recipientAddress,
        transaction.data.amount,
        STARK_TOKEN_CONTRACT_ID
      );
      break;

    case TransactionMode.TRANSFER_TOKEN:
      if (!transaction.data.amount) {
        throw new UserInputError("Amount is required");
      }

      transaction.data.fees = await estimateTransferFees(
        transaction.data.senderAddress,
        transaction.data.recipientAddress,
        transaction.data.amount,
        transaction.data.tokenId
      );
      break;
    default:
      break;
  }
}

export { completeTransaction };
