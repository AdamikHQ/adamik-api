import { OKLINK_API_KEY } from "~/app/config/apiKeys";
import { CHAINS } from "~/app/config/chains";
import {
  AccountState,
  AccountTokens,
  ChainId,
  FinalizedTransaction,
  Paginated,
  Provider,
  ProviderType,
  TokenAmount,
  TokenType,
  TransactionMode,
  TransactionState,
} from "~/app/model/types_WIP";
import { amountToSmallestUnit } from "~/app/tools/amount";
import {
  InvalidPaginationTokenError,
  ThirdPartyProviderError,
  TransactionIdNotFoundError,
} from "~/app/tools/handlers/errors";
import { paginationFromB64, paginationToB64 } from "~/app/tools/pagination";
import { getTRC20TokenInfo } from "./node";
import {
  OkLinkAccountStateResponse,
  OkLinkTokenInfo,
  OkLinkTokensAccountStateResponse,
  OkLinkTransactionInfo,
} from "./types";
const explorerURL = CHAINS.tron.providers.find((b: Provider) => b.type === ProviderType.oklink)?.url;

async function fetchTransaction(transactionId: string): Promise<FinalizedTransaction> {
  const url = `${explorerURL}/transaction/transaction-fills?chainShortName=TRON&txid=${transactionId}`;

  const response = await fetch(url, {
    headers: {
      "Ok-Access-Key": OKLINK_API_KEY,
    },
  });

  const transactionResponse: {
    code: string;
    msg: string;
    data: OkLinkTransactionInfo[];
  } = await response.json();

  if (!transactionResponse?.data?.[0]) {
    throw new TransactionIdNotFoundError(transactionId, ChainId.TRON);
  }

  const transaction = transactionResponse.data[0];

  let tokenId: string | undefined;
  let amount: string | null;
  let mode = TransactionMode.TRANSFER;

  switch (transaction.transactionType) {
    case "TriggerSmartContract":
      mode = TransactionMode.TRANSFER_TOKEN;
      tokenId = transaction.tokenTransferDetails[0].tokenContractAddress;
      const { decimals } = await getTRC20TokenInfo(tokenId);
      amount = amountToSmallestUnit(transaction.tokenTransferDetails[0].amount, Number(decimals));
      if (amount === null) {
        throw new ThirdPartyProviderError(`Failed to fetch amount of transaction tron : ${transactionId}`);
      }
      break;
    case "TransferAssetContract":
      mode = TransactionMode.TRANSFER_TOKEN;
    // TRC10 is not well handle by OKLINK.
    default:
      amount = amountToSmallestUnit(transaction.amount, CHAINS.tron.decimals);
      if (amount === null) {
        throw new ThirdPartyProviderError(`Failed to fetch amount of transaction tron : ${transactionId}`);
      }
      break;
  }

  const feesAmount = amountToSmallestUnit(transaction.txfee, CHAINS.tron.decimals);
  if (feesAmount === null) {
    throw new ThirdPartyProviderError(`Failed to fetch fees of transaction tron : ${transactionId}`);
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
      amount: BigInt(feesAmount),
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

  const amount = amountToSmallestUnit(token.holdingAmount, Number(tokenInfo.decimals));
  if (amount === null) {
    throw new ThirdPartyProviderError(`Failed to fetch amount of token tron : ${token.tokenContractAddress}`);
  }

  return {
    token: {
      type: TokenType.TRC20,
      id: token.tokenContractAddress,
      name: tokenInfo.name,
      ticker: token.symbol,
      decimals: Number(tokenInfo.decimals),
    },
    amount: BigInt(amount),
  };
}

async function fetchAccountData(address: string): Promise<AccountState> {
  const url = `${explorerURL}/address/address-summary?chainShortName=TRON&address=${address}`;

  const response = await fetch(url, {
    headers: {
      "Ok-Access-Key": OKLINK_API_KEY,
    },
  });

  const okLinkAccountSummaryResponse: OkLinkAccountStateResponse = await response.json();

  const urlTRC20 = `${explorerURL}/address/token-balance?chainShortName=TRON&address=${address}&protocolType=token_20&limit=50`;
  const responseTRC20 = await fetch(urlTRC20, {
    headers: {
      "Ok-Access-Key": OKLINK_API_KEY,
    },
  });

  const okLinkTokenAccountStateResponse: OkLinkTokensAccountStateResponse = await responseTRC20.json();

  const nativeAmount = amountToSmallestUnit(
    okLinkAccountSummaryResponse.data[0]?.balance ?? "0",
    CHAINS.tron.decimals
  );
  if (nativeAmount === null) {
    throw new ThirdPartyProviderError(`Failed to fetch amount of native token tron : ${address}`);
  }

  return {
    balances: {
      native: {
        available: BigInt(nativeAmount),
        total: BigInt(nativeAmount),
      },
      tokens: await Promise.all([
        ...(okLinkTokenAccountStateResponse.data[0]?.tokenList ?? []).map(okLinkTokenToTokenAmount),
      ]),
    },
  };
}

async function fetchAccountTokensData(
  address: string,
  paginationToken?: string
): Promise<Paginated<AccountTokens>> {
  // Format is different from Tronscan
  // To avoid pagination collision
  const paginationData = paginationFromB64(paginationToken) as
    | { type: ProviderType; page: string }
    | undefined;
  let startParam = "1";

  if (paginationData) {
    if (paginationData.type === ProviderType.oklink && paginationData.page) {
      startParam = paginationData.page;
    } else {
      throw new InvalidPaginationTokenError("Provided pagination token is invalid");
    }
  }

  const url = `${explorerURL}/address/token-balance?chainShortName=TRON&address=${address}&protocolType=token_20&limit=50&page=${startParam}`;
  const response = await fetch(url, {
    headers: {
      "Ok-Access-Key": OKLINK_API_KEY,
    },
  });

  const okLinkTokenAccountStateResponse: OkLinkTokensAccountStateResponse = await response.json();

  let nextPage: string | null = null;
  if (
    Number(okLinkTokenAccountStateResponse.data[0]?.page) <
    Number(okLinkTokenAccountStateResponse.data[0]?.totalPage)
  ) {
    nextPage = paginationToB64({
      type: ProviderType.oklink,
      page: String(Number(okLinkTokenAccountStateResponse.data[0]?.page) + 1),
    });
  }

  return {
    tokens: await Promise.all([
      ...(okLinkTokenAccountStateResponse.data[0]?.tokenList ?? []).map(okLinkTokenToTokenAmount),
    ]),
    pagination: {
      nextPage: nextPage ?? null,
    },
  };
}

export { fetchAccountData, fetchAccountTokensData, fetchTransaction };
