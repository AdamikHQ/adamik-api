import { Transaction } from "~/app/model/types_WIP";
import { getEstimatedFees } from "../logic";
import { fetchAccount, fetchBalances } from "../backend/node";
import { CosmosService } from ".";
import { CHAINS } from "~/app/config/chains";
import { CosmosChainParams, CosmosTransactionParams } from "../types";

async function completeTransaction(this: CosmosService, transaction: Transaction): Promise<void> {
  const chainParams = CHAINS[this.chainId].params as CosmosChainParams;

  const address = transaction.plain.senders[0];
  const balances = await fetchBalances(this.chainId, address);
  const balance = balances.find((balance) => balance.denom === chainParams?.denom);
  if (!balance) {
    throw new Error(`Failed to retrieve balance for ${this.chainId} address ${address}`);
  }

  const balanceAmount = BigInt(balance.amount);

  if (transaction.plain.useMaxAmount) {
    transaction.plain.amount = balanceAmount - 2500n; // Simulated amount, just for estimating fees
  }

  const { gasWanted, gasWantedFees } = await getEstimatedFees(this.chainId, transaction.plain);

  if (transaction.plain.useMaxAmount) {
    transaction.plain.amount = balanceAmount > gasWantedFees ? balanceAmount - gasWantedFees : 0n;
  }

  transaction.plain.fees = gasWantedFees;
  transaction.plain.gas = gasWanted;

  const transactionParams = transaction.plain.params as CosmosTransactionParams;
  if (!transactionParams?.pubKey) {
    const account = await fetchAccount(this.chainId, transaction.plain.senders[0]);

    // pubKeyType and pubKey are provided by the blockchain only when the address already has recorded transaction(s)
    if (account.pubKey) {
      transaction.plain.params = {
        pubKey: account.pubKey,
      };
    } else {
      transaction.status.errors.push({
        message: "Public key of the sender address not found on the blockchain, it must be provided manually",
      });
    }
  }
}

export { completeTransaction };
