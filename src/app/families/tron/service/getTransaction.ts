import { FinalizedTransaction, TransactionMode, TransactionState } from "~/app/model/types_WIP";
import { TronService } from ".";
import { fetchTronscanTransaction } from "../backend/explorer";

async function getTransaction(
  this: TronService,
  transactionId: string
): Promise<FinalizedTransaction | null> {
  const tronTransaction = await fetchTronscanTransaction(transactionId);
  if (!tronTransaction) {
    return null;
  }

  const parsedTransaction: FinalizedTransaction["parsed"] = {
    chainId: this.chainId,
    id: tronTransaction.hash,
    mode: tronTransaction.tokenTransferInfo ? TransactionMode.TRANSFER_TOKEN : TransactionMode.TRANSFER,
    tokenId: tronTransaction.tokenTransferInfo?.contract_address || undefined,
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
