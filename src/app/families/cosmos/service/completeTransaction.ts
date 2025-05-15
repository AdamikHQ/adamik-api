import { Status, Transaction, TransactionMode } from "~/app/model/types_WIP";
import { CosmosAccountSequenceMismatchError } from "~/app/tools/handlers/errors";
import { fetchAccount } from "../backend/node";
import { COSMOS_MOCK_FEES } from "../constants";
import { getAvailableBalance, getEstimatedFees, getStakedBalance, resolvePubKey } from "../logic";
import { CosmosService } from "../service";

async function completeTransaction(
  this: CosmosService,
  args: {
    transaction: Transaction;
    status: Status;
  }
): Promise<void> {
  const { transaction } = args;

  const spendableBalance = await (async (): Promise<bigint> => {
    switch (transaction.data.mode) {
      case TransactionMode.TRANSFER: {
        const { senderAddress } = transaction.data;
        return getAvailableBalance(this.chainId, senderAddress);
      }

      case TransactionMode.STAKE: {
        const { senderAddress, sourceValidatorAddress } = transaction.data;

        if (sourceValidatorAddress?.length) {
          return getStakedBalance(this.chainId, senderAddress, sourceValidatorAddress);
        } else {
          return getAvailableBalance(this.chainId, senderAddress);
        }
      }

      case TransactionMode.UNSTAKE: {
        const { senderAddress, validatorAddress } = transaction.data;
        return getStakedBalance(this.chainId, senderAddress, validatorAddress);
      }

      default:
        return 0n;
    }
  })();

  if (transaction.data.useMaxAmount) {
    // Simulated amount, just for estimating fees
    // Must be: 0 > amount > max spendable, otherwise the simulation endpoint refuses to cooperate
    transaction.data.amount = spendableBalance > COSMOS_MOCK_FEES ? spendableBalance - COSMOS_MOCK_FEES : 1n;
  }

  const account = await fetchAccount(this.chainId, transaction.data.senderAddress);

  // NOTE getEstimatedFees calls the node's /simulate endpoint,
  // which also performs some validation on the transaction data
  let gasWanted: bigint | undefined;
  let gasWantedFees: bigint | undefined;
  try {
    ({ gasWanted, gasWantedFees } = await getEstimatedFees(this.chainId, account, transaction.data));
  } catch (error) {
    if (error instanceof CosmosAccountSequenceMismatchError && !transaction.data.nonce) {
      // If the account sequence mismatch error is thrown, we will update with new values
      account.sequence = BigInt(parseInt(error.message));
      transaction.data.nonce = account.sequence;
      ({ gasWanted, gasWantedFees } = await getEstimatedFees(this.chainId, account, transaction.data));
    } else {
      throw error;
    }
  }

  transaction.data.fees = gasWantedFees;
  transaction.data.gas = gasWanted;

  if (transaction.data.useMaxAmount) {
    switch (transaction.data.mode) {
      case TransactionMode.TRANSFER: {
        transaction.data.amount =
          spendableBalance > transaction.data.fees ? spendableBalance - transaction.data.fees : 0n;
        break;
      }

      case TransactionMode.STAKE: {
        if (transaction.data.sourceValidatorAddress?.length) {
          transaction.data.amount = spendableBalance;
        } else {
          transaction.data.amount =
            spendableBalance > transaction.data.fees ? spendableBalance - transaction.data.fees : 0n;
        }
        break;
      }

      case TransactionMode.UNSTAKE: {
        transaction.data.amount = spendableBalance;
        break;
      }
    }
  }

  transaction.data.nonce = account.sequence;

  // Babylon use-case
  // For this mode transactionData.senderPubKey is guaranteed and must not be changed
  if (transaction.data.mode !== TransactionMode.REGISTER_STAKE) {
    const { pubKey } = resolvePubKey(this.chainId, account, transaction.data);
    transaction.data.senderPubKey = pubKey;
  }
}

export { completeTransaction };
