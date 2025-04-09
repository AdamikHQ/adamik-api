import {
  AccountState,
  DeployContractType,
  Status,
  Transaction,
  TransactionMode,
} from "~/app/model/types_WIP";
import { prevalidateTransactionCommon } from "../../common";
import { getNonce } from "../backend/node";
import { ArgentX } from "../contracts/argentx";
import { calculateAccountState, verifyStarknetPublicKeyFormat } from "../logic";
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

  switch (transaction.data.mode) {
    case TransactionMode.TRANSFER: {
      const nonce = await getNonce(transaction.data.senderAddress);

      if (nonce === 0) {
        status.errors.push({ message: "Sender account does not exist" });
      }

      const transactionData = transaction.data;
      const accountData = await calculateAccountState(transaction.data.senderAddress);
      const availableBalance = accountData.balances.native?.available;
      const amount = transactionData.amount as bigint;

      if (availableBalance && amount > BigInt(availableBalance)) {
        status.errors.push({ message: "Balance is too low to cover transfer amount" });
      }

      if (transaction.data.format) {
        status.warnings.push({
          message: `Field 'format' is not supported for chain ID ${this.chainId}, it will be ignored`,
        });
      }
      break;
    }

    case TransactionMode.TRANSFER_TOKEN: {
      if (!transaction.data.tokenId) {
        status.errors.push({ message: "Token ID is required" });
      }

      const transactionData = transaction.data;
      const accountData = await calculateAccountState(transaction.data.senderAddress);
      const availableTokenBalance = accountData.balances.tokens?.find(
        (token) => token.token.id === transactionData.tokenId
      )?.amount;
      const amount = transactionData.amount as bigint;

      if (availableTokenBalance && amount > BigInt(availableTokenBalance)) {
        status.errors.push({ message: "Balance is too low to cover transfer amount" });
      }
      break;
    }

    case TransactionMode.DEPLOY_ACCOUNT: {
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
      break;
    }
  }
}

async function validateTransaction(
  this: StarknetService,
  _: {
    transaction: Transaction;
    status: Status;
  }
): Promise<void> {
  const { transaction, status } = _;

  let accountData: AccountState | undefined;
  if ([TransactionMode.TRANSFER, TransactionMode.TRANSFER_TOKEN].includes(transaction.data.mode)) {
    accountData = await calculateAccountState(transaction.data.senderAddress);
    const amount = transaction.data.amount as bigint;
    const fees = transaction.data.fees as bigint;

    if (amount < fees * 10n) {
      status.warnings.push({ message: "Network fees are above 10% of the amount" });
    }
  } else if (transaction.data.mode === TransactionMode.DEPLOY_ACCOUNT) {
    verifyStarknetPublicKeyFormat(transaction.data.senderPubKey);
    const address = ArgentX.generateAddress(transaction.data.senderPubKey);
    accountData = await calculateAccountState(address);
  }

  if (!accountData) {
    status.errors.push({ message: "Account does not exist" });
    return;
  }

  const availableBalance = accountData.balances.native?.available;
  const fees = transaction.data.fees as bigint;

  // - fees < nativeBalance
  if (availableBalance && fees > BigInt(availableBalance)) {
    status.errors.push({ message: "Balance is too low to cover the fees" });
  }
}

export { prevalidateTransaction, validateTransaction };
