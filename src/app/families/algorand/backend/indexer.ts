import { ChainId, ProviderType } from "~/app/model/types_WIP";
import { getProviderUrls } from "../../common";
import { AlgoTransaction } from "./types";

const ROOT_URL = getProviderUrls(ChainId.ALGORAND, ProviderType.algoindexer)[0];

async function fetchTransaction(transactionId: string): Promise<AlgoTransaction | null> {
  const url = `${ROOT_URL}/transactions/${transactionId}`;

  const response = await fetch(url).then((response) => response.json());

  if ("message" in response) {
    return null;
  }

  const result: Partial<AlgoTransaction> = {
    currentRound: response["current-round"],
    confirmedRound: response.transaction["confirmed-round"],
    fee: response.transaction.fee,
    id: response.transaction.id,
    txType: response.transaction["tx-type"],
    roundTime: response.transaction["round-time"],
    sender: response.transaction["sender"],
  };

  if (result.txType === "pay") {
    result.paymentTransaction = {
      amount: response.transaction["payment-transaction"]["amount"],
      receiver: response.transaction["payment-transaction"]["receiver"],
    };
  }

  if (result.txType === "axfer") {
    result.assetTransferTransaction = {
      amount: response.transaction["asset-transfer-transaction"]["amount"],
      receiver: response.transaction["asset-transfer-transaction"]["receiver"],
      assetId: response.transaction["asset-transfer-transaction"]["asset-id"],
    };
  }

  return result as AlgoTransaction;
}

export { fetchTransaction };
