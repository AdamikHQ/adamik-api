import { PublicKey } from "@solana/web3.js";
import { Status, Transaction, TransactionMode } from "~/app/model/types_WIP";
import { UserInputError } from "~/app/tools/handlers/errors";
import { prevalidateTransactionCommon } from "../../common";
import { fetchAccount, fetchAccountTokenBalance } from "../backend/node";
import { SolanaService } from "../service";

async function prevalidateTransaction(
  this: SolanaService,
  args: {
    transaction: Transaction;
    status: Status;
  }
): Promise<void> {
  const { transaction, status } = args;

  await prevalidateTransactionCommon(this.chainId, {
    transactionData: transaction.data,
    status,
    addressValidationFn: async (address: string) => PublicKey.isOnCurve(address),
  });
}

async function validateTransaction(
  this: SolanaService,
  args: {
    transaction: Transaction;
    status: Status;
  }
): Promise<void> {
  const { transaction, status } = args;

  const transactionData = transaction.data;
  const nativeBalance = await fetchAccount(transaction.data.senderAddress);
  const amount = transactionData.amount;
  const fees = transactionData.fees;

  if (!amount) {
    throw new UserInputError("Amount or fees are required");
  }

  if (!fees) {
    throw new UserInputError("Fees doesn't seems to be calculated");
  }

  switch (transaction.data.mode) {
    case TransactionMode.TRANSFER:
      if (transaction.data.amount === undefined) {
        throw new UserInputError("Amount is required");
      }

      if (nativeBalance === null) {
        status.errors.push({ message: "Sender address does not exist" });
      }

      if (nativeBalance && nativeBalance.balance < amount + fees) {
        status.errors.push({ message: "Balance is too low" });
      }

      break;

    case TransactionMode.TRANSFER_TOKEN:
      const tokenBalance = await fetchAccountTokenBalance(
        transaction.data.senderAddress,
        transaction.data.tokenId
      );

      if (tokenBalance === null) {
        status.errors.push({ message: "Insufficient token balance" });
      }

      if (tokenBalance && tokenBalance < amount) {
        status.errors.push({ message: "Insufficient token balance" });
      }
      break;
  }

  if (nativeBalance && fees > BigInt(nativeBalance.balance)) {
    status.errors.push({ message: "Balance is too low to cover the fees" });
  }

  if (amount < fees * 10n) {
    status.warnings.push({ message: "Network fees are above 10% of the amount" });
  }
}

export { prevalidateTransaction, validateTransaction };
