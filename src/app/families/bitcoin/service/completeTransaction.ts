import { fetchBabylonDelegation } from "~/app/families/babylon/backend/babylonAPI";
import {
  buildBabylonStakingPayloads,
  buildWithdrawalPsbt,
  retrieveUnbondingPsbtFromDelegation,
} from "~/app/families/babylon/logic";
import { Status, Transaction, TransactionMode } from "~/app/model/types_WIP";
import { AdamikApiServerError, UnsupportedFeatureError, UserInputError } from "~/app/tools/handlers/errors";
import { buildTransferPsbt } from "../logic";
import { BitcoinService } from "../service";

// NOTE bitcoin family does it differently than others:
// PSBTs are already encoded transactions, but they have to be computed
// here in completeTransaction to be able to deduce fees and amount...
async function completeTransaction(
  this: BitcoinService,
  _: {
    transaction: Transaction;
    status: Status;
  }
): Promise<void> {
  const { transaction, status } = _;

  switch (transaction.data.mode) {
    case TransactionMode.TRANSFER:
      {
        const { psbt: transferPsbt, fee: fees } = await buildTransferPsbt(
          this.chainId,
          transaction.data,
          status
        );

        // TODO Test this
        if (transaction.data.useMaxAmount) {
          const recipientOutput = transferPsbt.txOutputs.find(
            (output) => output.address === transaction.data.recipientAddress
          );

          if (recipientOutput) {
            transaction.data.amount = BigInt(recipientOutput.value);
          }
        }

        transaction.data.params = {
          transferPsbt: transferPsbt.toHex(),
        };

        transaction.data.fees = BigInt(fees);
      }
      break;

    case TransactionMode.STAKE:
      {
        const { stakingPsbt, slashingPsbt, unbondingSlashingPsbt, unbondingTransaction, fees } =
          await buildBabylonStakingPayloads(this.chainId, transaction.data);

        transaction.data.params = {
          stakingPsbt: stakingPsbt.toHex(),
          slashingPsbt: slashingPsbt.toHex(),
          unbondingSlashingPsbt: unbondingSlashingPsbt.toHex(),
          unbondingTransaction: unbondingTransaction.toHex(),
        };

        transaction.data.fees = BigInt(fees);
      }
      break;
    case TransactionMode.UNSTAKE:
      {
        if (!transaction.data.stakeId?.length) {
          throw new AdamikApiServerError(`Missing 'stakeId' field in transaction`);
        }

        const babylonDelegation = await fetchBabylonDelegation(this.chainId, transaction.data.stakeId);
        if (!babylonDelegation) {
          console.warn(`/!\\ Staking position not found for stake ID ${transaction.data.stakeId}`);
          throw new UserInputError(`Staking position not found for stake ID ${transaction.data.stakeId}`);
        }

        const { unbondingPsbt, unbondingFees } = await retrieveUnbondingPsbtFromDelegation(
          this.chainId,
          transaction.data,
          babylonDelegation
        );

        transaction.data.params = {
          unbondingTransaction: unbondingPsbt.toHex(),
        };

        transaction.data.fees = unbondingFees;
      }
      break;

    case TransactionMode.WITHDRAW:
      {
        if (!transaction.data.stakeId?.length) {
          throw new UserInputError(
            `Stake ID must be provided for ${this.chainId} transaction mode '${transaction.data.mode}'`
          );
        }
        const babylonDelegation = await fetchBabylonDelegation(this.chainId, transaction.data.stakeId);
        if (!babylonDelegation) {
          console.warn(`/!\\ Staking position not found for stake ID ${transaction.data.stakeId}`);
          throw new UserInputError(`Staking position not found for stake ID ${transaction.data.stakeId}`);
        }

        const { psbt: withdrawalPsbt, fee: fees } = await buildWithdrawalPsbt(
          this.chainId,
          transaction.data,
          babylonDelegation
        );

        transaction.data.params = {
          withdrawalPsbt: withdrawalPsbt.toHex(),
        };

        transaction.data.fees = BigInt(fees);
      }
      break;

    default:
      throw new UnsupportedFeatureError(
        `Unsupported transaction mode ${transaction.data.mode} for chain ${this.chainId}`
      );
  }
}

export { completeTransaction };
