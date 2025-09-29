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

  // Self send of TRX is forbidden on Tron
  if (
    transaction.data.mode === TransactionMode.TRANSFER &&
    transaction.data.recipientAddress === transaction.data.senderAddress
  ) {
    status.errors.push({
      message: `Transfer of TRX to the same account is forbidden on chain ${this.chainId}`,
    });
  }
}

async function validateTransaction(
  this: TronService,
  _: { transaction: Transaction; status: Status }
): Promise<void> {
  const { transaction, status } = _;

  // TODO Add validation rule:
  // if recipient address is empty, need to send at least 1 TRX ?...
  // or sender balance can't be less than 1 TRX ?...

  const transactionData = transaction.data;
  const accountData = await fetchAccountData(this.chainId, transactionData.senderAddress);
  const availableBalance = accountData.balances?.native?.available;
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
      const tokenData = accountData.balances?.tokens?.find(
        (token) => token.token.id === transactionData.tokenId
      );
      if (tokenData && amount > BigInt(tokenData.amount)) {
        status.errors.push({ message: "Token balance is too low" });
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
