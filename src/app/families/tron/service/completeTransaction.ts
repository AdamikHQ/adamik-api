import { Transaction } from "~/app/model/types_WIP";
import { getAccount, getAccountResources, getChainParameters } from "../backend/node";
import { buildTransaction, calculateTransactionLength } from "../logic";

async function completeTransaction(transaction: Transaction): Promise<void> {
  const accountResources = await getAccountResources(transaction.data.sender);
  const usableBandwidth = accountResources.freeNetUsed
    ? accountResources.freeNetLimit - accountResources.freeNetUsed
    : accountResources.NetLimit - accountResources.NetUsed;

  const buildedTransaction = await buildTransaction(transaction);
  transaction.encoded = buildedTransaction.raw_data_hex;
  const chainParameters = await getChainParameters();
  const bandwidthPrice = chainParameters.find((p) => p.key === "getTransactionFee")?.value || 0 / 1000_000;

  const bandwidthPoints = calculateTransactionLength(buildedTransaction.raw_data_hex);
  transaction.data.fees = BigInt(0);

  const targetedAccount = await getAccount(transaction.data.recipient);
  if (!targetedAccount.balance) {
    const accountCreationFee = chainParameters.find((p) => p.key === "createAccountFee")?.value || 0;
    const createNewAccountFeeInSystemContract =
      chainParameters.find((p) => p.key === "createNewAccountFeeInSystemContract")?.value || 0;
    transaction.data.fees = BigInt(accountCreationFee + createNewAccountFeeInSystemContract); // 1 TRX Fees for account creation
  }

  // Check if the user has enough bandwidth
  if (usableBandwidth < bandwidthPoints) {
    console.log(`Insufficient bandwidth. Available: ${usableBandwidth}, Required: ${bandwidthPoints}`);
    transaction.data.fees += BigInt(bandwidthPrice * bandwidthPrice);
  }
}

export { completeTransaction };
