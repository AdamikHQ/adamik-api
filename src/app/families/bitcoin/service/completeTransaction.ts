import { Status, Transaction, TransactionMode } from "~/app/model/types_WIP";
import { UnsupportedFeatureError, UserInputError } from "~/app/tools/handlers/errors";
import { fetchNetworkInfo } from "../backend/babylon";
import { fetchTransactionRaw } from "../backend/mempoolSpace";
import { getNetworkForChainId } from "../logic";
import {
  buildSlashingPsbt,
  buildStakingPsbt,
  buildStakingScripts,
  buildTransferPsbt,
  buildUnbondingPsbt,
  buildUnbondingSlashingPsbt,
} from "../psbt";
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

        transaction.data.fees = BigInt(fees);

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
      }
      break;

    case TransactionMode.STAKE:
      {
        const babylonNetworkInfo = await fetchNetworkInfo();
        const bitcoinNetworkInfo = getNetworkForChainId(this.chainId);
        const stakingScripts = buildStakingScripts(transaction.data, babylonNetworkInfo);

        // When staking, the staking transaction is the one that we are building (unsigned)
        const {
          transaction: stakingTransaction,
          psbt: stakingPsbt,
          fee: fees,
        } = await buildStakingPsbt(this.chainId, transaction.data, stakingScripts, bitcoinNetworkInfo);

        // TODO Test these
        const { psbt: slashingPsbt } = buildSlashingPsbt(
          stakingScripts,
          stakingTransaction,
          babylonNetworkInfo,
          bitcoinNetworkInfo
        );
        const { psbt: unbondingSlashingPsbt } = buildUnbondingSlashingPsbt(
          stakingScripts,
          stakingTransaction,
          babylonNetworkInfo,
          bitcoinNetworkInfo
        );

        transaction.data.fees = BigInt(fees);

        transaction.data.params = {
          stakingPsbt: stakingPsbt.toHex(),
          slashingPsbt: slashingPsbt.toHex(),
          unbondingSlashingPsbt: unbondingSlashingPsbt.toHex(),
        };
      }
      break;
    case TransactionMode.UNSTAKE: {
      // TODO in prevalidateTransaction
      if (!transaction.data.stakeId?.length) {
        throw new UserInputError(`Missing 'stakeId' field in transaction`);
      }

      const babylonNetworkInfo = await fetchNetworkInfo();
      const bitcoinNetworkInfo = getNetworkForChainId(this.chainId);
      const stakingScripts = buildStakingScripts(transaction.data, babylonNetworkInfo);

      // When unstaking, the staking transaction was previously broadcasted and
      // should now be confirmed, so we retrieve it from the network
      // TODO Handle case where staking tx is not found
      const stakingTransaction = await fetchTransactionRaw(this.chainId, transaction.data.stakeId);

      const { psbt: unbondingPsbt, fee: fees } = buildUnbondingPsbt(
        stakingScripts,
        stakingTransaction,
        babylonNetworkInfo,
        bitcoinNetworkInfo
      );

      transaction.data.fees = BigInt(fees);

      transaction.data.params = {
        unbondingPsbt: unbondingPsbt.toHex(),
      };
    }

    default:
      throw new UnsupportedFeatureError(
        `Unsupported transaction mode ${transaction.data.mode} for chain ${this.chainId}`
      );
  }
}

export { completeTransaction };
