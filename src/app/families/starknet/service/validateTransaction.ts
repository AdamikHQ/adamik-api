import { DeployContractType, Status, Transaction, TransactionMode } from "~/app/model/types_WIP";
import { prevalidateTransactionCommon } from "../../common";
import { ArgentX } from "../contracts/argentx";
import { getNonce } from "../contracts/logic";
import { StarknetService } from "../service";
import { validateAddress } from "./validateAddress";

async function prevalidateTransaction(
  this: StarknetService,
  _: {
    transaction: Transaction;
    status: Status;
  }
): Promise<void> {
  const { transaction, status } = _;

  await prevalidateTransactionCommon(this.chainId, {
    transactionData: transaction.data,
    status,
    addressValidationFn: validateAddress,
  });

  if (transaction.data.mode === TransactionMode.DEPLOY_ACCOUNT) {
    if (!transaction.data.senderPubKey) {
      status.errors.push({ message: "Sender public key is required" });
    }

    if (!transaction.data.contractType) {
      status.errors.push({ message: "Contract type is required" });
    }

    if (transaction.data.contractType !== DeployContractType.ARGENTX) {
      status.errors.push({ message: "Only ArgentX is supported for now" });
    }

    const address = ArgentX.generateAddress(transaction.data.senderPubKey);
    const nonce = await getNonce(address);

    if (nonce !== 0) {
      status.errors.push({ message: "Account already exists" });
    }
  }

  if ([TransactionMode.TRANSFER, TransactionMode.TRANSFER_TOKEN].includes(transaction.data.mode)) {
    const nonce = await getNonce(transaction.data.senderAddress);

    if (nonce === 0) {
      status.errors.push({ message: "Sender account does not exist" });
    }
  }

  if (transaction.data.format) {
    status.warnings.push({
      message: `Field 'format' is not supported for chain ID ${this.chainId}, it will be ignored`,
    });
  }
}

async function validateTransaction(
  this: StarknetService,
  _: {
    transaction: Transaction;
    status: Status;
  }
): Promise<void> {}

export { prevalidateTransaction, validateTransaction };
