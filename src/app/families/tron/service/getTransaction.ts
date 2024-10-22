import { FinalizedTransaction, TransactionMode, TransactionState } from "~/app/model/types_WIP";
import { TransactionIdNotFoundError } from "~/app/tools/handlers/errors";
import { TronService } from ".";
import { fetchTronscanTransaction } from "../backend/tronscan";

async function getTransaction(this: TronService, transactionId: string): Promise<FinalizedTransaction> {
  const tronTransaction = await fetchTronscanTransaction(transactionId);
  if (!tronTransaction) {
    throw new TransactionIdNotFoundError(transactionId, this.chainId);
  }

  const parsedTransaction: FinalizedTransaction["parsed"] = {
    chainId: this.chainId,
    id: tronTransaction.hash,
    mode: tronTransaction.contractData.tokenInfo ? TransactionMode.TRANSFER_TOKEN : TransactionMode.TRANSFER,
    tokenId:
      tronTransaction.contractData?.contract_address ||
      tronTransaction.contractData?.tokenInfo?.tokenId ||
      undefined,
    senders: [{ address: tronTransaction.ownerAddress }],
    recipients: [
      tronTransaction.tokenTransferInfo
        ? {
            address: tronTransaction.tokenTransferInfo?.to_address || "",
            amount: BigInt(tronTransaction.tokenTransferInfo?.amount_str || "0"),
          }
        : {
            address: tronTransaction.toAddress,
            amount: BigInt(tronTransaction.contractData?.amount || "0"),
          },
    ],
    fees: BigInt(tronTransaction.cost.energy_fee + tronTransaction.cost.net_fee),
    state:
      tronTransaction.contractRet === "SUCCESS" ? TransactionState.CONFIRMED : TransactionState.UNCONFIRMED,
    timestamp: tronTransaction.timestamp,
    blockHeight: BigInt(tronTransaction.block),
  };

  return { parsed: parsedTransaction, raw: tronTransaction };
}

export { getTransaction };
