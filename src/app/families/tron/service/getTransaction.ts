import { FinalizedTransaction, TransactionMode, TransactionState } from "~/app/model/types_WIP";
import { TransactionIdNotFoundError } from "~/app/tools/handlers/errors";
import { fetchTransaction } from "../backend/tronscan";
import { TronService } from "../service";

async function getTransaction(this: TronService, transactionId: string): Promise<FinalizedTransaction> {
  const tronTransaction = await fetchTransaction(transactionId);
  if (!tronTransaction) {
    throw new TransactionIdNotFoundError(transactionId, this.chainId);
  }

  const amount = tronTransaction.tokenTransferInfo
    ? tronTransaction.tokenTransferInfo?.amount_str
    : tronTransaction.contractData?.amount;
  if (!amount) {
    console.warn(
      `/!\\ Invalid transaction data in response from explorer for chainId ${this.chainId}:`,
      tronTransaction
    );
    throw new Error(`Invalid data in response from explorer for chain ID ${this.chainId}`);
  }

  const parsedTransaction: FinalizedTransaction["parsed"] = {
    id: tronTransaction.hash,
    mode: tronTransaction.contractData.tokenInfo ? TransactionMode.TRANSFER_TOKEN : TransactionMode.TRANSFER,
    tokenId:
      tronTransaction.contractData?.contract_address ||
      tronTransaction.contractData?.tokenInfo?.tokenId ||
      undefined,
    senders: [
      {
        address: tronTransaction.ownerAddress,
        amount: BigInt(amount),
      },
    ],
    recipients: [
      tronTransaction.tokenTransferInfo
        ? {
            address: tronTransaction.tokenTransferInfo?.to_address || "",
            amount: BigInt(amount),
          }
        : {
            address: tronTransaction.toAddress,
            amount: BigInt(amount),
          },
    ],
    fees: { amount: BigInt(tronTransaction.cost.energy_fee + tronTransaction.cost.net_fee) },
    state:
      tronTransaction.contractRet === "SUCCESS" ? TransactionState.CONFIRMED : TransactionState.UNCONFIRMED,
    timestamp: tronTransaction.timestamp,
    blockHeight: BigInt(tronTransaction.block),
  };

  return {
    parsed: parsedTransaction,
    raw: tronTransaction,
  };
}

export { getTransaction };
