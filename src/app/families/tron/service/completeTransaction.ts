import { Status, Transaction, TransactionMode } from "~/app/model/types_WIP";
import { estimateEnergyContract, getAccount, getAccountResources, getChainParameters } from "../backend/node";
import { buildTransaction, calculateTransactionLength, isTRC10Token } from "../logic";

// https://www.notion.so/Fees-Energy-Bandwidth-1192ca550f9c80fdba26deba08f24505
async function completeTransaction(_: { transaction: Transaction; status: Status }): Promise<void> {
  const { transaction } = _;

  const accountResources = await getAccountResources(transaction.data.senderAddress);
  const usableBandwidth = accountResources.freeNetUsed
    ? accountResources.freeNetLimit - accountResources.freeNetUsed
    : accountResources.NetLimit - accountResources.NetUsed;

  const buildedTransaction = await buildTransaction(transaction);
  transaction.encoded = buildedTransaction.raw_data_hex;
  const chainParameters = await getChainParameters();
  const bandwidthPrice = chainParameters.find((p) => p.key === "getTransactionFee")?.value || 0 / 1000_000;

  const bandwidthPoints = calculateTransactionLength(buildedTransaction.raw_data_hex);
  transaction.data.fees = BigInt(0);

  const targetedAccount = await getAccount(transaction.data.recipientAddress);
  if (!targetedAccount.balance) {
    const accountCreationFee = chainParameters.find((p) => p.key === "createAccountFee")?.value || 0;
    const createNewAccountFeeInSystemContract =
      chainParameters.find((p) => p.key === "createNewAccountFeeInSystemContract")?.value || 0;
    transaction.data.fees = BigInt(accountCreationFee + createNewAccountFeeInSystemContract); // 1 TRX Fees for account creation
  }

  // Check if the user has enough bandwidth
  if (usableBandwidth < bandwidthPoints) {
    // console.log(`Insufficient bandwidth. Available: ${usableBandwidth}, Required: ${bandwidthPoints}`);
    transaction.data.fees += BigInt(bandwidthPrice * bandwidthPoints);
  }

  if (transaction.data.mode === TransactionMode.TRANSFER_TOKEN && !isTRC10Token(transaction.data.tokenId)) {
    const { energy_used } = await estimateEnergyContract(
      transaction.data.tokenId,
      transaction.data.amount as bigint,
      transaction.data.recipientAddress,
      transaction.data.senderAddress
    );

    // Calculate available energy
    const availableEnergy = accountResources.EnergyLimit - (accountResources.EnergyUsed || 0);

    // Check if there's enough energy
    if (availableEnergy <= energy_used) {
      const energyFee = BigInt(energy_used - availableEnergy);
      const energyPrice = chainParameters.find((p) => p.key === "getEnergyFee")?.value || 0;

      transaction.data.fees += energyFee * BigInt(energyPrice);
    }
  }
}

export { completeTransaction };
