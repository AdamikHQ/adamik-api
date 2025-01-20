import { Status, Transaction, TransactionMode } from "~/app/model/types_WIP";
import { prevalidateTransactionCommon } from "../../common";
import { isValidAddress } from "../backend/node";
import { fetchAccountData } from "../backend/tronscan";
import { TronService } from "../service";

async function prevalidateTransaction(
  this: TronService,
  _: { transaction: Transaction; status: Status }
): Promise<void> {
  const { transaction, status } = _;

  await prevalidateTransactionCommon(this.chainId, {
    transactionData: transaction.data,
    status,
    addressValidationFn: async (address: string) => isValidAddress(address),
  });
}

async function validateTransaction(
  this: TronService,
  _: { transaction: Transaction; status: Status }
): Promise<void> {
  const { transaction, status } = _;

  const transactionData = transaction.data;
  const accountData = await fetchAccountData(transactionData.senderAddress);
  const availableBalance = accountData.balance;
  const amount = transactionData.amount as bigint;
  const fees = transactionData.fees as bigint;

  switch (transactionData.mode) {
    case TransactionMode.TRANSFER: {
      // - amount + fees < nativeBalance
      if (availableBalance && amount + fees > BigInt(availableBalance)) {
        status.errors.push({ message: "Balance is too low" });
      }
      break;
    }
    case TransactionMode.TRANSFER_TOKEN: {
      const tokenData = accountData.withPriceTokens.find(
        (token) => token.tokenId === transactionData.tokenId
      );
      if (tokenData && amount > BigInt(tokenData.balance)) {
        status.errors.push({ message: "Insufficient token balance" });
      }
      break;
    }
  }

  // - fees < nativeBalance
  if (availableBalance && fees > BigInt(availableBalance)) {
    status.errors.push({ message: "Balance is too low to cover the fees" });
  }

  if (amount < fees * 10n) {
    status.warnings.push({ message: "Network fees are above 10% of the amount" });
  }
}

export { prevalidateTransaction, validateTransaction };
