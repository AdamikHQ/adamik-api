import { Status, Transaction, TransactionMode } from "~/app/model/types_WIP";
import { UnsupportedFeatureError } from "~/app/tools/handlers/errors";
import { fetchFeePerByte } from "../backend/blockchair";
import { buildStakingPsbt, buildStakingScripts, buildTransferPsbt, buildUnbondingPsbt } from "../psbt";
import { BitcoinService } from "../service";
import { BitcoinTransactionParams, PsbtWithFee } from "../types";

async function completeTransaction(
  this: BitcoinService,
  _: {
    transaction: Transaction;
    status: Status;
  }
): Promise<void> {
  const { transaction, status } = _;

  const feePerByte = await fetchFeePerByte(this.chainId);

  // NOTE bitcoin family does it differently than others:
  // The PSBT is already the encoded transaction, but it has to be computed
  // here in completeTransaction to be able to deduce fees and amount...
  let psbtWithFee: PsbtWithFee;
  switch (transaction.data.mode) {
    case TransactionMode.TRANSFER:
      psbtWithFee = await buildTransferPsbt(this.chainId, transaction, feePerByte, status);
      break;

    case TransactionMode.STAKE:
    case TransactionMode.UNSTAKE:
      const stakingScripts = await buildStakingScripts(transaction);

      psbtWithFee =
        transaction.data.mode === TransactionMode.STAKE
          ? await buildStakingPsbt(this.chainId, transaction, stakingScripts, feePerByte)
          : await buildUnbondingPsbt(this.chainId, transaction, stakingScripts, feePerByte);
      break;

    default:
      throw new UnsupportedFeatureError(
        `Unsupported transaction mode ${transaction.data.mode} for chain ${this.chainId}`
      );
  }

  transaction.data.fees = BigInt(psbtWithFee.fee);

  // TODO Test this
  if (transaction.data.useMaxAmount) {
    const recipientOutput = psbtWithFee.psbt.txOutputs.find(
      (output) => output.address === transaction.data.recipientAddress
    );

    if (recipientOutput) {
      transaction.data.amount = BigInt(recipientOutput.value);
    }
  }

  transaction.data.params = psbtWithFee as BitcoinTransactionParams;
}

export { completeTransaction };
