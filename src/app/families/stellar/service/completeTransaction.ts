import { Status, Transaction, TransactionMode } from "~/app/model/types_WIP";
import { UnsupportedFeatureError } from "~/app/tools/handlers/errors";
import { fetchAccount } from "../backend/horizon";
import { calculateMaxSpendable, calculateMaxSpendableToken, calculateTransactionFee } from "../logic";
import { StellarService } from "../service";

async function completeTransaction(
  this: StellarService,
  _: {
    transaction: Transaction;
    status: Status;
  }
): Promise<void> {
  const { transaction } = _;

  transaction.data.fees = await calculateTransactionFee(transaction.data);

  if (transaction.data.useMaxAmount) {
    const stellarAccount = await fetchAccount(transaction.data.senderAddress);

    switch (transaction.data.mode) {
      case TransactionMode.TRANSFER:
        {
          const maxSpendable = calculateMaxSpendable(stellarAccount, transaction.data.mode);
          transaction.data.amount = maxSpendable - transaction.data.fees;

          if (transaction.data.amount < 0n) {
            transaction.data.amount = 0n;
          }
        }
        break;

      case TransactionMode.TRANSFER_TOKEN:
        {
          const maxTokenAmount = calculateMaxSpendableToken(stellarAccount, transaction.data.tokenId);
          transaction.data.amount = maxTokenAmount;
        }
        break;

      default:
        throw new UnsupportedFeatureError(
          `Transaction mode ${transaction.data.mode} is not supported for chainId stellar`
        );
    }
  }
}

export { completeTransaction };
