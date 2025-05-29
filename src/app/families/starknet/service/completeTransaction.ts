import { DeployContractType, Status, Transaction, TransactionMode } from "~/app/model/types_WIP";
import { UserInputError } from "~/app/tools/handlers/errors";
import { estimateTransferFees, getNonce } from "../backend/node";
import { STARK_TOKEN_CONTRACT_ID } from "../constants";
import { ArgentX } from "../contracts/argentx";
import { verifyStarknetPublicKeyFormat } from "../logic";
import { StarknetService } from "../service";

async function completeTransaction(
  this: StarknetService,
  {
    transaction,
    status,
  }: {
    transaction: Transaction;
    status: Status;
  }
): Promise<void> {
  if (transaction.data.senderPubKey) {
    verifyStarknetPublicKeyFormat(transaction.data.senderPubKey);
  }

  switch (transaction.data.mode) {
    case TransactionMode.DEPLOY_ACCOUNT:
      switch (transaction.data.contractType) {
        case DeployContractType.ARGENTX:
          const nonce = await getNonce(this.chainId, ArgentX.generateAddress(transaction.data.senderPubKey));
          transaction.data.nonce = BigInt(nonce);
          if (transaction.data.nonce !== 0n) {
            throw new UserInputError("Nonce is not 0, can't deploy wallet contract");
          }
          transaction.data.fees = await ArgentX.estimateDeployFees(
            this.chainId,
            transaction.data.senderPubKey
          );
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
        this.chainId,
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
        this.chainId,
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
