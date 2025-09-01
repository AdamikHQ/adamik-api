import { Status, Transaction, TransactionMode } from "~/app/model/types_WIP";
import { prevalidateTransactionCommon } from "../../common";
import { fetchAccount, getJettonsFromWallet } from "../backend/tonapi";
import { isAddressValid } from "../logic";
import { TonService } from "../service";

async function prevalidateTransaction(
  this: TonService,
  _: {
    transaction: Transaction;
    status: Status;
  }
): Promise<void> {
  const { transaction, status } = _;

  await prevalidateTransactionCommon(this.chainId, {
    transactionData: transaction.data,
    status,
    addressValidationFn: isAddressValid,
  });
}

async function validateTransaction(
  this: TonService,
  _: {
    transaction: Transaction;
    status: Status;
  }
): Promise<void> {
  const { transaction, status } = _;
  const transactionData = transaction.data;

  // TODO: More checks
  if (
    transactionData.mode === TransactionMode.TRANSFER &&
    transactionData.nonce === 0n &&
    !transactionData.senderPubKey
  ) {
    status.errors.push({
      message: `Field 'senderPubKey' is required in order to initialize the wallet`,
    });
  }

  // Balance validation checks
  // amount & fees are safe to cast as they're guaranteed to be set by completeTransaction
  const amount = transactionData.amount as bigint;
  const fees = transactionData.fees as bigint;

  if (amount > 0n || fees > 0n) {
    // Fetch account directly from backend to get current balance
    const account = await fetchAccount(transactionData.senderAddress);
    const availableBalance = BigInt(account.balance);

    switch (transactionData.mode) {
      case TransactionMode.TRANSFER:
        if (fees > availableBalance) {
          status.errors.push({ message: "Balance is too low to cover the fees" });
        } else if (amount + fees > availableBalance) {
          status.errors.push({ message: "Balance is too low" });
        }
        break;

      case TransactionMode.TRANSFER_TOKEN:
        if (fees > availableBalance) {
          status.errors.push({ message: "Balance is too low to cover the fees" });
        }

        // Check if token balance covers amount
        if (transactionData.tokenId) {
          const jettons = await getJettonsFromWallet(transactionData.senderAddress);
          const tokenBalance = jettons.balances.find(
            (balance) => balance.jetton.address.toString() === transactionData.tokenId
          );

          if (!tokenBalance || BigInt(tokenBalance.balance) < amount) {
            status.errors.push({ message: "Token balance is too low" });
          }
        }
        break;
    }

    // Add warning if fees are high relative to amount (above 10%)
    if (amount > 0n && fees > (amount * 10n) / 100n) {
      status.warnings.push({
        message: "Network fees are above 10% of the transaction amount",
      });
    }
  }
}

export { prevalidateTransaction, validateTransaction };
