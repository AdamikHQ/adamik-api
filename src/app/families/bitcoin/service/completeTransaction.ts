import { buildBabylonStakingPayloads } from "~/app/families/babylon/logic";
import { Status, Transaction, TransactionMode } from "~/app/model/types_WIP";
import { UnsupportedFeatureError } from "~/app/tools/handlers/errors";
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
        const { stakingPsbt, slashingPsbt, unbondingSlashingPsbt, unbondingTransaction, fees } =
          await buildBabylonStakingPayloads(this.chainId, transaction.data);

        transaction.data.fees = BigInt(fees);

        transaction.data.params = {
          stakingPsbt: stakingPsbt.toHex(),
          slashingPsbt: slashingPsbt.toHex(),
          unbondingSlashingPsbt: unbondingSlashingPsbt.toHex(),
          unbondingTransaction: unbondingTransaction.toHex(),
        };
      }
      break;
    case TransactionMode.UNSTAKE: {
      // FIXME Implem properly + move everything to babylon.ts
      /*
      // TODO in prevalidateTransaction
      if (!transaction.data.stakeId?.length) {
        throw new UserInputError(`Missing 'stakeId' field in transaction`);
      }

      const babylonStakingParams = await fetchAllBabylonStakingParams();
      const bitcoinNetworkInfo = getNetworkForChainId(this.chainId);
      const stakingScripts = buildStakingScripts(transaction.data, babylonStakingParams);

      // When unstaking, the staking transaction was previously broadcasted and
      // should now be confirmed, so we retrieve it from the network
      // TODO Handle case where staking tx is not found
      const stakingTransaction: BitcoinTransaction =
        this.chainId === ChainId.BITCOIN_SIGNET
          ? await fetchNativeTransactionMempoolSpace(this.chainId, transaction.data.stakeId)
          : BitcoinTransaction.fromHex(
              (await fetchRawTransactionBlockchair(this.chainId, transaction.data.stakeId)).raw_transaction
            );

      // FIXME Not good! Must be the same unbonding tx that was build during stake flow
      // --> must be provided by the API ?
      // --> can be retrieved through delegations ?...
      const { psbt: unbondingPsbt, fee: fees } = buildUnbondingPsbt(
        stakingScripts,
        stakingTransaction,
        babylonStakingParams,
        bitcoinNetworkInfo
      );

      transaction.data.fees = BigInt(fees);

      transaction.data.params = {
        unbondingTransaction: unbondingPsbt.toHex(),
      };
      break;
      */
    }

    default:
      throw new UnsupportedFeatureError(
        `Unsupported transaction mode ${transaction.data.mode} for chain ${this.chainId}`
      );
  }
}

export { completeTransaction };
