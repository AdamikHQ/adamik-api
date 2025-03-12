import { TRONSCAN_API_KEY } from "~/app/config/apiKeys";
import { CHAINS } from "~/app/config/chains";
import {
  AccountState,
  AccountTokens,
  Backend,
  ChainId,
  FinalizedTransaction,
  Paginated,
  ProviderType,
  Token,
  TokenAmount,
  TokenType,
  TransactionMode,
  TransactionState,
} from "~/app/model/types_WIP";
import {
  InvalidPaginationTokenError,
  ThirdPartyProviderError,
  TransactionIdNotFoundError,
} from "~/app/tools/handlers/errors";
import { paginationFromB64, paginationToB64 } from "~/app/tools/pagination";
import { TronscanAccountInfo, TronscanAccountTokensInfo, TronscanTransactionInfo } from "./types";

const TRONSCAN_PAGE_SIZE = 20;

const explorerURL = CHAINS.tron.backends.find((b: Backend) => b.providerType === ProviderType.tronscan)?.url;

async function fetchTransaction(transactionId: string): Promise<FinalizedTransaction> {
  const url = `${explorerURL}/api/transaction-info?hash=${transactionId}`;

  const response = await fetch(url, {
    headers: {
      "TRON-PRO-API-KEY": TRONSCAN_API_KEY,
    },
  });

  const tronTransaction: TronscanTransactionInfo = await response.json();

  if (!tronTransaction) {
    throw new TransactionIdNotFoundError(transactionId, ChainId.TRON);
  }

  const amount = tronTransaction.tokenTransferInfo
    ? tronTransaction.tokenTransferInfo?.amount_str
    : tronTransaction.contractData?.amount;
  if (!amount) {
    console.warn(`/!\\ Invalid transaction data in response from explorer:`, tronTransaction);
    throw new Error(`Invalid data in response from explorer`);
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

async function fetchAccountData(address: string): Promise<AccountState> {
  const url = `${explorerURL}/api/accountv2?address=${address}`;

  const response = await fetch(url, {
    headers: {
      "TRON-PRO-API-KEY": TRONSCAN_API_KEY,
    },
  });

  const accountData: TronscanAccountInfo = await response.json();

  // Tronscan instability... in rare cases some data seems wrong or missing?...
  if (accountData?.balance === undefined || accountData?.withPriceTokens === undefined) {
    console.warn(`/!\\ Invalid account data from tron explorer:`, accountData);
    throw new ThirdPartyProviderError("Invalid response received from tron explorer");
  }

  const nativeBalance = BigInt(accountData.balance);

  const tokens: TokenAmount[] = [];
  accountData.withPriceTokens
    ?.filter(
      (tokenData) =>
        // We only support TRC10 and TRC20 token types
        ["trc10", "trc20"].includes(tokenData.tokenType) &&
        // Some special case tokens are irrelevant (e.g main currency TRX is listed as a special TRC10)
        tokenData.tokenId !== "_"
    )
    .forEach((tokenData) => {
      const tokenType = tokenData.tokenType === "trc10" ? TokenType.TRC10 : TokenType.TRC20;

      const token: Token = {
        type: tokenType,
        id: tokenData.tokenId,
        name: tokenData.tokenName,
        ticker: tokenData.tokenAbbr,
        decimals: tokenData.tokenDecimal,
        logo: tokenData.tokenLogo,
      };

      if (tokenType === TokenType.TRC20) {
        token.contractAddress = tokenData.tokenId;
      }

      tokens.push({
        token,
        amount: BigInt(tokenData.balance),
      });
    });

  return {
    balances: {
      native: {
        available: nativeBalance,
        total: nativeBalance,
      },
      tokens,
    },
  };
}

async function fetchAccountTokensData(
  address: string,
  paginationToken?: string
): Promise<Paginated<AccountTokens>> {
  let startParam = "0";

  const searchParams = new URLSearchParams({
    address: address,
    limit: TRONSCAN_PAGE_SIZE.toString(),
  });

  const paginationData = paginationFromB64(paginationToken);
  if (paginationData) {
    if (typeof paginationData === "string") {
      startParam = paginationData;
      searchParams.set("start", startParam);
    } else {
      throw new InvalidPaginationTokenError("Provided pagination token is invalid");
    }
  }

  const url = `${explorerURL}/api/account/tokens?${searchParams}`;

  const response = await fetch(url, {
    headers: {
      "TRON-PRO-API-KEY": TRONSCAN_API_KEY,
    },
  });

  const tokensInfo: TronscanAccountTokensInfo = await response.json();

  const tokens: TokenAmount[] = [];
  tokensInfo?.data
    ?.filter((tokenInfo) => ["trc10", "trc20"].includes(tokenInfo.tokenType) && tokenInfo.tokenId !== "_")
    .forEach((tokenInfo) => {
      const tokenType = tokenInfo.tokenType === "trc10" ? TokenType.TRC10 : TokenType.TRC20;

      const token: Token = {
        type: tokenType,
        id: tokenInfo.tokenId,
        name: tokenInfo.tokenName,
        ticker: tokenInfo.tokenAbbr,
        decimals: tokenInfo.tokenDecimal,
      };

      if (tokenType === TokenType.TRC20) {
        token.contractAddress = tokenInfo.tokenId;
      }

      tokens.push({
        token,
        amount: BigInt(tokenInfo.balance),
      });
    });

  const nextPage =
    tokensInfo?.data.length < TRONSCAN_PAGE_SIZE
      ? null
      : paginationToB64((Number(startParam) + TRONSCAN_PAGE_SIZE).toFixed());

  return {
    tokens,
    pagination: {
      nextPage,
    },
  };
}

export { fetchAccountData, fetchAccountTokensData, fetchTransaction };
