import { MINTSCAN_API_KEY } from "~/app/config/apiKeys";
import { CHAINS } from "~/app/config/chains";
import { ChainId, FinalizedTransaction, TransactionMode, TransactionState } from "~/app/model/types_WIP";
import { paginationFromB64, paginationToB64 } from "~/app/tools/convertors/pagination";
import { InvalidPaginationTokenError } from "~/app/tools/handlers/errors";
import { CosmosChainParams } from "../types";
import { MintscanAccountTransactionsResponse, MintscanTransaction } from "./types";

const MINTSCAN_PAGE_SIZE = 20;

const getRootUrl = (chainId: ChainId) => CHAINS[chainId].backends.explorerURL;

const MINTSCAN_CHAIN_IDS: Map<ChainId, string> = new Map([
  [ChainId.COSMOSHUB, "cosmos"],
  [ChainId.OSMOSIS, "osmosis"],
  [ChainId.CELESTIA, "celestia"],
  [ChainId.DYDX, "dydx"],
  [ChainId.AXELAR, "axelar"],
  [ChainId.INJECTIVE, "injective"],
  [ChainId.AKASH, "akash"],
  [ChainId.NEUTRON, "neutron"],
  [ChainId.EVMOS, "evmos"],
  [ChainId.JUNO, "juno"],
  [ChainId.SEI, "sei"],
  [ChainId.STRIDE, "stride"],
  [ChainId.KAVA, "kava"],
  //NOT SUPPORTED BY MINTSCAN YET
  // [ChainId.IRISNET, "iris"],
  // [ChainId.TERRA, "terra2"],
  // [ChainId.LUM_NETWORK, "lum"],
  // [ChainId.OMNIFLIX, "omniflix"],
  // [ChainId.STARGAZE, "stargaze"],
  // [ChainId.BAND, "band"],
  // [ChainId.DYMENSION, "dymension"],
  // [ChainId.KYVE, "kyve"],
  // [ChainId.CHIHUAHUA, "chihuahua"],
  // [ChainId.SEDA, "seda"],
  // [ChainId.SHENTU, "shentu"],
]);

async function fetchWithHeaders(url: string, options: RequestInit = {}) {
  const newOptions: RequestInit = {
    ...options,
    headers: {
      ...options.headers,
      Authorization: MINTSCAN_API_KEY,
    },
  };

  return fetch(url, newOptions);
}

async function fetchTransaction(
  chainId: ChainId,
  transactionId: string
): Promise<MintscanTransaction | null> {
  const mintscanChainId = MINTSCAN_CHAIN_IDS.get(chainId);
  if (!mintscanChainId) {
    console.warn(`/!\\ Chain ID ${chainId} is not supported by Mintscan API`);
    return null;
  }

  const url = `${getRootUrl(chainId)}/${mintscanChainId}/txs/${transactionId}`;

  const response = await fetchWithHeaders(url).then((response) => response.json());

  if (!response.length) {
    return null;
  }

  return response[0] as MintscanTransaction;
}

async function fetchAccountTransactions(
  chainId: ChainId,
  address: string,
  paginationToken?: string
): Promise<{ cosmosTransactions: MintscanTransaction[]; nextPage: string | null }> {
  const mintscanChainId = MINTSCAN_CHAIN_IDS.get(chainId);
  if (!mintscanChainId) {
    console.warn(`/!\\ Chain ID ${chainId} is not supported by Mintscan API`);
    return { cosmosTransactions: [], nextPage: null };
  }

  const paginationData = paginationFromB64(paginationToken);

  const searchParams = new URLSearchParams();
  if (paginationData) {
    if (typeof paginationData === "string") {
      searchParams.set("searchAfter", paginationData);
    } else {
      throw new InvalidPaginationTokenError("Provided pagination token is invalid");
    }
  }

  // For some reason, providing either 'fromDateTime' or 'toDateTime' is mandatory
  // or the endpoint returns aberrant results... hence this default value
  searchParams.set("fromDateTime", "1970-01-01");

  const url = `${getRootUrl(chainId)}/${mintscanChainId}/accounts/${address}/transactions?` + searchParams;

  const response: MintscanAccountTransactionsResponse = await fetchWithHeaders(url.toString()).then(
    (response) => response.json()
  );

  if (!Array.isArray(response?.transactions)) {
    console.warn(`/!\\ Invalid response from ${chainId} explorer endpoint: ${url.toString()}:`, response);
    return { cosmosTransactions: [], nextPage: null };
  }

  // FIXME Mintscan bug... a 'searchAfter' token is still provided with the last page, instead of null
  // so we skip it to avoid a useless last call to the API that returns empty data
  const nextPage =
    response.transactions?.length < MINTSCAN_PAGE_SIZE
      ? null
      : paginationToB64(response?.pagination?.searchAfter);

  return {
    cosmosTransactions: response.transactions,
    nextPage,
  };
}

function mintscanToAdamikTransaction(
  chainId: ChainId,
  mintscanTransaction: MintscanTransaction
): FinalizedTransaction["parsed"] {
  // https://docs.cosmos.network/v0.46/core/transactions.html#signing-transactions

  if ("type" in mintscanTransaction.tx && mintscanTransaction.tx.type === "cosmos-sdk/StdTx") {
    return parseLegacyAminoTransaction(chainId, mintscanTransaction);
  } else if (
    "@type" in mintscanTransaction.tx &&
    mintscanTransaction.tx["@type"] === "/cosmos.tx.v1beta1.Tx"
  ) {
    return parseProtobufTransaction(chainId, mintscanTransaction);
  }
}

// A lot of duplicated code between parseLegacyAminoTransaction() and parseProtobufTransaction()
// because mintscan types are a PITA and only a few JSON keys differ...
// FIXME Should refacto though, to put as much as possible in common

function parseLegacyAminoTransaction(
  chainId: ChainId,
  mintscanTransaction: MintscanTransaction
): FinalizedTransaction["parsed"] {
  if (!("type" in mintscanTransaction.tx && mintscanTransaction.tx.type === "cosmos-sdk/StdTx")) {
    console.warn(
      `/!\\ Invalid mintscan payload for transaction ${mintscanTransaction.txhash} of chainId ${chainId}`
    );
    throw new Error(`Internal error while parsing ${chainId} transactions`);
  }

  const tx = mintscanTransaction.tx["cosmos-sdk/StdTx"];

  const transactionFees = tx.value.fee.amount[0];

  let parsedTransaction: FinalizedTransaction["parsed"] = {
    id: mintscanTransaction.txhash,
    fees: transactionFees
      ? {
          amount: BigInt(transactionFees.amount),
          ticker: transactionFees.denom,
        }
      : {
          amount: 0n,
        },
    gas: BigInt(mintscanTransaction.gas_used),
    // Placeholder values, actual values filled below
    mode: "unknown",
    state: TransactionState.UNKNOWN,
  };

  if (mintscanTransaction.height !== "") {
    parsedTransaction.timestamp = new Date(mintscanTransaction.timestamp).getTime();
    parsedTransaction.blockHeight = BigInt(mintscanTransaction.height);

    if (mintscanTransaction.code === 0) {
      parsedTransaction.state = TransactionState.CONFIRMED;
    } else {
      parsedTransaction.state = TransactionState.FAILED;
    }
  }

  // TODO Handling only the 1st message at the moment, but should handle them all into individual transactions
  switch (tx.value.msg[0]["type"]) {
    case "cosmos-sdk/MsgSend": {
      const message = tx.value.msg[0]["cosmos-sdk/MsgSend"].value;

      parsedTransaction.mode = TransactionMode.TRANSFER;

      parsedTransaction.senders = [
        {
          address: message.from_address,
          amount: BigInt(message.amount[0].amount),
          ticker: message.amount[0].denom, // FIXME Could need a mapping with the tickers that we define in config/chains.ts
        },
      ];

      parsedTransaction.recipients = [
        {
          address: message.to_address,
          amount: BigInt(message.amount[0].amount),
          ticker: message.amount[0].denom, // FIXME Could need a mapping with the tickers that we define in config/chains.ts
        },
      ];

      break;
    }
    case "cosmos-sdk/MsgDelegate": {
      const message = tx.value.msg[0]["cosmos-sdk/MsgDelegate"].value;

      parsedTransaction.mode = TransactionMode.DELEGATE;

      parsedTransaction.senders = [
        {
          address: message.delegator_address,
          amount: BigInt(message.amount.amount),
        },
      ];

      parsedTransaction.validators = {
        target: {
          address: message.validator_address,
          amount: BigInt(message.amount.amount),
        },
      };

      break;
    }
    case "cosmos-sdk/MsgBeginRedelegate": {
      const message = tx.value.msg[0]["cosmos-sdk/MsgBeginRedelegate"].value;

      parsedTransaction.mode = TransactionMode.REDELEGATE;

      parsedTransaction.senders = [
        {
          address: message.delegator_address,
          amount: 0n,
        },
      ];

      parsedTransaction.validators = {
        source: {
          address: message.validator_src_address,
          amount: BigInt(message.amount.amount),
        },
        target: {
          address: message.validator_dst_address,
          amount: BigInt(message.amount.amount),
        },
      };

      break;
    }
    case "cosmos-sdk/MsgUndelegate": {
      const message = tx.value.msg[0]["cosmos-sdk/MsgUndelegate"].value;

      parsedTransaction.mode = TransactionMode.UNDELEGATE;

      parsedTransaction.senders = [
        {
          address: message.delegator_address,
          amount: 0n,
        },
      ];

      parsedTransaction.validators = {
        target: {
          address: message.validator_address,
          amount: BigInt(message.amount.amount),
        },
      };

      break;
    }
    case "cosmos-sdk/MsgWithdrawDelegatorReward": {
      const message = tx.value.msg[0]["cosmos-sdk/MsgWithdrawDelegatorReward"].value;

      const chain = CHAINS[chainId];
      const chainParams = chain.params as CosmosChainParams;

      // Multiple reward amounts will be crammed in the 'value' string, e.g:
      // "value": "104ibc/D41ECC8FEF1B7E9C4BCC58B1362588420853A9D0B898EDD513D9B79AFFA195C8,5ibc/E92E07E68705FAD13305EE9C73684B30A7B66A52F54C9890327E0A4C0F1D22E3,...,84047uatom"
      const withdrawEvent = mintscanTransaction.logs[0]?.events.find(
        (event) => event.type === "withdraw_rewards"
      );
      const amounts = withdrawEvent?.attributes.find((attr) => attr.key === "amount")?.value;

      // So we parse it to only get native rewards at the moment, IBC rewards are not supported for now
      // TODO Support IBC rewards
      const amount = amounts
        ?.split(",")
        .find((amount) => amount.includes(chainParams.denom)) // --> "84047uatom" (keep only the native amount)
        ?.slice(0, -chainParams.denom.length); // -->"84047" (keep only its value)

      parsedTransaction.mode = TransactionMode.CLAIM_REWARDS;

      parsedTransaction.senders = [
        {
          address: message.delegator_address,
          amount: 0n,
        },
      ];

      parsedTransaction.validators = {
        target: {
          address: message.validator_address,
          amount: BigInt(amount || 0n),
        },
      };

      break;
    }
    // Type not supported (yet?)
    default:
      console.warn(
        `/!\\ Unsupported parsing of transaction ${mintscanTransaction.txhash} for chainId ${chainId}`
      );
  }

  return parsedTransaction;
}

function parseProtobufTransaction(
  chainId: ChainId,
  mintscanTransaction: MintscanTransaction
): FinalizedTransaction["parsed"] {
  if (!("@type" in mintscanTransaction.tx && mintscanTransaction.tx["@type"] === "/cosmos.tx.v1beta1.Tx")) {
    console.warn(
      `/!\\ Invalid mintscan payload for transaction ${mintscanTransaction.txhash} of chainId ${chainId}`
    );
    throw new Error(`Internal error while parsing ${chainId} transactions`);
  }

  const tx = mintscanTransaction.tx["/cosmos-tx-v1beta1-Tx"];

  const transactionFees = tx?.auth_info?.fee?.amount[0];

  let parsedTransaction: FinalizedTransaction["parsed"] = {
    id: mintscanTransaction.txhash,
    fees: transactionFees
      ? {
          amount: BigInt(transactionFees.amount),
          ticker: transactionFees.denom,
        }
      : {
          amount: 0n,
        },
    gas: BigInt(mintscanTransaction.gas_used),
    // Placeholder values, actual values filled below
    mode: "unknown",
    state: TransactionState.UNKNOWN,
  };

  if (mintscanTransaction.height !== "") {
    parsedTransaction.timestamp = new Date(mintscanTransaction.timestamp).getTime();
    parsedTransaction.blockHeight = BigInt(mintscanTransaction.height);

    if (mintscanTransaction.code === 0) {
      parsedTransaction.state = TransactionState.CONFIRMED;
    } else {
      parsedTransaction.state = TransactionState.FAILED;
    }
  }

  const signerInfos = tx.auth_info.signer_infos;
  if (signerInfos.length && signerInfos[0].sequence !== undefined) {
    parsedTransaction.nonce = BigInt(signerInfos[0].sequence);
  }

  // TODO Handling only the 1st message at the moment, but should handle them all into individual transactions
  switch (tx.body.messages[0]["@type"]) {
    case "/cosmos.bank.v1beta1.MsgSend": {
      const message = tx.body.messages[0]["/cosmos-bank-v1beta1-MsgSend"];

      parsedTransaction.mode = TransactionMode.TRANSFER;

      parsedTransaction.senders = [
        {
          address: message.from_address,
          amount: BigInt(message.amount[0].amount),
          ticker: message.amount[0].denom, // FIXME Could need a mapping with the tickers that we define in config/chains.ts
        },
      ];

      parsedTransaction.recipients = [
        {
          address: message.to_address,
          amount: BigInt(message.amount[0].amount),
          ticker: message.amount[0].denom, // FIXME Could need a mapping with the tickers that we define in config/chains.ts
        },
      ];

      break;
    }
    case "/cosmos.staking.v1beta1.MsgDelegate": {
      const message = tx.body.messages[0]["/cosmos-staking-v1beta1-MsgDelegate"];

      parsedTransaction.mode = TransactionMode.DELEGATE;

      parsedTransaction.senders = [
        {
          address: message.delegator_address,
          amount: BigInt(message.amount.amount),
        },
      ];

      parsedTransaction.validators = {
        target: {
          address: message.validator_address,
          amount: BigInt(message.amount.amount),
        },
      };

      break;
    }
    case "/cosmos.staking.v1beta1.MsgBeginRedelegate": {
      const message = tx.body.messages[0]["/cosmos-staking-v1beta1-MsgBeginRedelegate"];

      parsedTransaction.mode = TransactionMode.REDELEGATE;

      parsedTransaction.senders = [
        {
          address: message.delegator_address,
          amount: 0n,
        },
      ];

      parsedTransaction.validators = {
        source: {
          address: message.validator_src_address,
          amount: BigInt(message.amount.amount),
        },
        target: {
          address: message.validator_dst_address,
          amount: BigInt(message.amount.amount),
        },
      };

      break;
    }
    case "/cosmos.staking.v1beta1.MsgUndelegate": {
      const message = tx.body.messages[0]["/cosmos-staking-v1beta1-MsgUndelegate"];

      parsedTransaction.mode = TransactionMode.UNDELEGATE;

      parsedTransaction.senders = [
        {
          address: message.delegator_address,
          amount: 0n,
        },
      ];

      parsedTransaction.validators = {
        target: {
          address: message.validator_address,
          amount: BigInt(message.amount.amount),
        },
      };

      break;
    }
    case "/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward": {
      const message = tx.body.messages[0]["/cosmos-distribution-v1beta1-MsgWithdrawDelegatorReward"];

      const chain = CHAINS[chainId];
      const chainParams = chain.params as CosmosChainParams;

      // Multiple reward amounts will be crammed in the 'value' string, e.g:
      // "value": "104ibc/D41ECC8FEF1B7E9C4BCC58B1362588420853A9D0B898EDD513D9B79AFFA195C8,5ibc/E92E07E68705FAD13305EE9C73684B30A7B66A52F54C9890327E0A4C0F1D22E3,...,84047uatom"
      const withdrawEvent = mintscanTransaction.logs[0]?.events.find(
        (event) => event.type === "withdraw_rewards"
      );
      const amounts = withdrawEvent?.attributes.find((attr) => attr.key === "amount")?.value;

      // So we parse it to only get native rewards at the moment, IBC rewards are not supported for now
      // TODO Support IBC rewards
      const amount = amounts
        ?.split(",")
        .find((amount) => amount.includes(chainParams.denom)) // --> "84047uatom" (keep only the native amount)
        ?.slice(0, -chainParams.denom.length); // -->"84047" (keep only its value)

      parsedTransaction.mode = TransactionMode.CLAIM_REWARDS;

      parsedTransaction.senders = [
        {
          address: message.delegator_address,
          amount: 0n,
        },
      ];

      parsedTransaction.validators = {
        target: {
          address: message.validator_address,
          amount: BigInt(amount || 0n),
        },
      };

      break;
    }
    // Type not supported (yet?)
    default:
      console.warn(
        `/!\\ Unsupported parsing of transaction ${mintscanTransaction.txhash} for chainId ${chainId}`
      );
  }

  return parsedTransaction;
}

export { fetchAccountTransactions, fetchTransaction, MINTSCAN_CHAIN_IDS, mintscanToAdamikTransaction };
