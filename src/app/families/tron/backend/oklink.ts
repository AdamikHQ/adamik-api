import { OKLINK_API_KEY } from "~/app/config/apiKeys";
import { CHAINS } from "~/app/config/chains";
import {
  AccountState,
  AccountTokens,
  Backend,
  ChainId,
  FinalizedTransaction,
  Paginated,
  ProviderType,
  TokenAmount,
  TokenType,
  TransactionMode,
  TransactionState,
} from "~/app/model/types_WIP";
import { amountToSmallestUnit } from "~/app/tools/amount";
import { InvalidPaginationTokenError, TransactionIdNotFoundError } from "~/app/tools/handlers/errors";
import { paginationFromB64, paginationToB64 } from "~/app/tools/pagination";
import { getTRC20TokenInfo } from "./node";
import {
  OkLinkAccountStateResponse,
  OkLinkTokenInfo,
  OkLinkTokensAccountStateResponse,
  OkLinkTransactionInfo,
} from "./types";
const explorerURL = CHAINS.tron.backends.find((b: Backend) => b.providerType === ProviderType.oklink)?.url;

const fetchWithHeaders = async <T>(url: string, headers: Record<string, string>): Promise<T> => {
  const response = await fetch(url, { headers });
  return response.json();
};

async function fetchTransaction(transactionId: string): Promise<FinalizedTransaction> {
  const url = `${explorerURL}/transaction/transaction-fills?chainShortName=TRON&txid=${transactionId}`;

  const response = await fetchWithHeaders<{
    code: string;
    msg: string;
    data: OkLinkTransactionInfo[];
  }>(url, { "Ok-Access-Key": OKLINK_API_KEY });

  if (!response?.data?.[0]) {
    throw new TransactionIdNotFoundError(transactionId, ChainId.TRON);
  }

  const transaction = response.data[0];

  let tokenId: string | undefined;
  let amount: string;
  let mode = TransactionMode.TRANSFER;

  switch (transaction.transactionType) {
    case "TriggerSmartContract":
      mode = TransactionMode.TRANSFER_TOKEN;
      tokenId = transaction.tokenTransferDetails[0].tokenContractAddress;
      const { decimals } = await getTRC20TokenInfo(tokenId);
      amount = amountToSmallestUnit(transaction.tokenTransferDetails[0].amount, Number(decimals)) || "0";
      break;
    case "TransferAssetContract":
      mode = TransactionMode.TRANSFER_TOKEN;
    // TRC10 is not well handle by OKLINK.
    default:
      amount = amountToSmallestUnit(transaction.amount, CHAINS.tron.decimals) || "0";
      break;
  }

  const parsedTransaction: FinalizedTransaction["parsed"] = {
    id: transaction.txid,
    mode,
    tokenId,
    senders: [
      {
        address: transaction.inputDetails[0].inputHash,
        amount: BigInt(amount),
      },
    ],
    recipients: [
      {
        address: transaction.outputDetails[0].outputHash,
        amount: BigInt(amount),
      },
    ],
    fees: {
      amount: transaction.txfee
        ? BigInt(amountToSmallestUnit(transaction.txfee, CHAINS.tron.decimals) || "0")
        : BigInt(0),
    },
    state: transaction.state === "success" ? TransactionState.CONFIRMED : TransactionState.UNCONFIRMED,
    timestamp: Number(transaction.transactionTime),
    blockHeight: BigInt(transaction.height),
  };

  return {
    parsed: parsedTransaction,
    raw: transaction,
  };
}

async function okLinkTokenToTokenAmount(token: OkLinkTokenInfo): Promise<TokenAmount> {
  const tokenInfo = await getTRC20TokenInfo(token.tokenContractAddress);

  return {
    token: {
      type: TokenType.TRC20,
      id: token.tokenContractAddress,
      name: tokenInfo.name,
      ticker: token.symbol,
      decimals: Number(tokenInfo.decimals),
    },
    amount: BigInt(amountToSmallestUnit(token.holdingAmount, Number(tokenInfo.decimals)) ?? "0"),
  };
}

async function fetchAccountData(address: string): Promise<AccountState> {
  const url = `${explorerURL}/address/address-summary?chainShortName=TRON&address=${address}`;

  const response = await fetchWithHeaders<OkLinkAccountStateResponse>(url, {
    "Ok-Access-Key": OKLINK_API_KEY,
  });

  const urlTRC20 = `${explorerURL}/address/token-balance?chainShortName=TRON&address=${address}&protocolType=token_20&limit=50`;
  const responseTRC20 = await fetchWithHeaders<OkLinkTokensAccountStateResponse>(urlTRC20, {
    "Ok-Access-Key": OKLINK_API_KEY,
  });

  return {
    balances: {
      native: {
        available: BigInt(
          amountToSmallestUnit(response.data[0]?.balance ?? "0", CHAINS.tron.decimals) ?? "0"
        ),
        total: BigInt(amountToSmallestUnit(response.data[0]?.balance ?? "0", CHAINS.tron.decimals) ?? "0"),
      },
      tokens: await Promise.all([...(responseTRC20.data[0]?.tokenList ?? []).map(okLinkTokenToTokenAmount)]),
    },
  };
}

async function fetchAccountTokensData(
  address: string,
  paginationToken?: string
): Promise<Paginated<AccountTokens>> {
  // Format is different from Tronscan
  // To avoid pagination collision
  const paginationData = paginationFromB64(paginationToken) as { page: string } | string | undefined;
  let startParam = "1";

  if (paginationData) {
    if (typeof paginationData === "string") {
      startParam = "1"; // That's means it's coming from Tronscan so we restarting it
    } else if (typeof paginationData === "object" && paginationData.page) {
      startParam = paginationData.page;
    } else {
      throw new InvalidPaginationTokenError("Provided pagination token is invalid");
    }
  }

  const url = `${explorerURL}/address/token-balance?chainShortName=TRON&address=${address}&protocolType=token_20&limit=50&page=${startParam}`;
  const response = await fetchWithHeaders<OkLinkTokensAccountStateResponse>(url, {
    "Ok-Access-Key": OKLINK_API_KEY,
  });

  let nextPage: string | null = null;
  if (Number(response.data[0]?.page) < Number(response.data[0]?.totalPage)) {
    nextPage = paginationToB64({ page: String(Number(response.data[0]?.page) + 1) });
  }

  return {
    tokens: await Promise.all([...(response.data[0]?.tokenList ?? []).map(okLinkTokenToTokenAmount)]),
    pagination: {
      nextPage: nextPage ?? null,
    },
  };
}

export { fetchAccountData, fetchAccountTokensData, fetchTransaction };
