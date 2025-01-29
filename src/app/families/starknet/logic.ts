import { Account, Contract, Provider, shortString, stark } from "starknet";
import { CHAINS } from "~/app/config/chains";
import {
  AccountState,
  DeployContractType,
  FinalizedTransaction,
  TokenAmount,
  TokenType,
  Transaction,
  TransactionMode,
  TransactionState,
} from "~/app/model/types_WIP";
import { fetchTokenBalances, fetchTokenContract } from "./backend/indexer";
import { buildTransferPayload } from "./backend/node";
import { TokenBalance, TransactionResponse } from "./backend/types";
import { SELECTOR_INDEX, STARK_TOKEN_CONTRACT_ID } from "./constants";
import { ArgentX } from "./contracts/argentx";
import { StarknetDeployAccountPayload, StarknetInvokePayload } from "./types";

const buildTransaction = async (
  transaction: Transaction
): Promise<StarknetDeployAccountPayload | StarknetInvokePayload | undefined> => {
  const { amount, recipientAddress, senderAddress, mode } = transaction.data;

  switch (mode) {
    case TransactionMode.TRANSFER: {
      if (!amount || !recipientAddress || !senderAddress) {
        throw new Error("Missing transaction data");
      }
      const payload = await buildTransferPayload(
        senderAddress,
        recipientAddress,
        amount,
        STARK_TOKEN_CONTRACT_ID
      );

      return payload;
    }
    case TransactionMode.TRANSFER_TOKEN: {
      if (!amount || !recipientAddress || !senderAddress) {
        throw new Error("Missing transaction data");
      }
      const { tokenId } = transaction.data;
      const payload = await buildTransferPayload(senderAddress, recipientAddress, amount, tokenId);

      return payload;
    }

    case TransactionMode.DEPLOY_ACCOUNT: {
      const { senderPubKey, contractType } = transaction.data;
      switch (contractType) {
        case DeployContractType.ARGENTX: {
          const payload = await ArgentX.getDeployContractPayload(senderPubKey);
          return payload;
        }
        default: {
          throw new Error("Invalid contract type");
        }
      }
    }
  }
};

// TODO: Still WIP
const starkScanToAdamikTransaction = async (transaction: TransactionResponse) => {
  const parsedTransaction: FinalizedTransaction["parsed"] = {
    id: transaction.transaction_hash,
    timestamp: transaction.timestamp,
    fees: {
      amount: BigInt(transaction.actual_fee),
    },
    mode: "unknown",
    state: TransactionState.UNKNOWN,
    nonce: BigInt(transaction.nonce ?? 0),
  };

  if (transaction.transaction_execution_status === "SUCCEEDED") {
    parsedTransaction.state = TransactionState.CONFIRMED;
    parsedTransaction.blockHeight = BigInt(transaction.block_number);
  }

  const provider = new Provider({
    nodeUrl: CHAINS.starknet.backends.nodeURL,
  });

  if (transaction.transaction_type === "DEPLOY_ACCOUNT") {
    parsedTransaction.mode = TransactionMode.DEPLOY_ACCOUNT;
    return parsedTransaction;
  }

  const classAt = await provider.getClassAt(transaction.account_calls[0].contract_address || "");
  const transactionSelector = transaction.account_calls[0].selector;

  if (SELECTOR_INDEX.find((selector) => selector.selector === transactionSelector)) {
    parsedTransaction.mode = TransactionMode.TRANSFER;

    const recipientAddress = transaction.account_calls[0].calldata[0];
    const amount = transaction.account_calls[0].calldata[1];

    const contract = new Contract(classAt.abi, transaction.account_calls[0].contract_address || "", provider);
    const symbol = await contract.functions.symbol();
    const ticker = shortString.decodeShortString(symbol);

    parsedTransaction.senders = [{ address: transaction.sender_address, amount: BigInt(amount), ticker }];
    parsedTransaction.recipients = [{ address: recipientAddress, amount: BigInt(amount), ticker }];
  }

  return parsedTransaction;
};

const tokenBalanceToTokenAmount = async (tokenBalance: TokenBalance): Promise<TokenAmount> => {
  const tokenContract = await fetchTokenContract(tokenBalance.contract_address);

  return {
    amount: BigInt(tokenBalance.balance),
    token: {
      type: TokenType.ERC20, // not so sure about this
      id: tokenBalance.contract_address,
      name: tokenContract.name,
      ticker: tokenContract.symbol,
      decimals: Number(tokenContract.decimals),
    },
  };
};

const starknetTokenToAmount = (tokenBalances: TokenBalance[]) => {
  const tokenBalance = tokenBalances.find(
    (tokenBalance) => tokenBalance.contract_address === STARK_TOKEN_CONTRACT_ID
  );

  if (!tokenBalance) {
    return {
      available: BigInt(0),
      total: BigInt(0),
    };
  }

  return {
    available: BigInt(tokenBalance.balance),
    total: BigInt(tokenBalance.balance),
  };
};

async function calculateAccountState(accountId: string): Promise<AccountState> {
  const tokenBalances = await fetchTokenBalances(accountId);

  return {
    balances: {
      native: starknetTokenToAmount(tokenBalances),
      tokens: await Promise.all(
        tokenBalances
          .filter((tokenBalance) => tokenBalance.contract_address !== STARK_TOKEN_CONTRACT_ID)
          .map((tokenBalance) => tokenBalanceToTokenAmount(tokenBalance))
      ),
    },
  };
}

// NOTE:
// we use stark.randomAddress() that will create a random private key that we are not using
// because on how starknet js work, the third argument on account is a mandatory signer or private key to allow them
// to sign in one go, but in our case we will need to use our custom method that allow to get a payload that we can sign async
const createStarknetAccount = async (provider: Provider, address: string): Promise<Account> => {
  const account = new Account(provider, address, stark.randomAddress());
  return account;
};

// NOTE:
// https://starknetjs.com/docs/guides/estimate_fees#fee-limitation
// we add 10% to the suggestedMaxFee as recommended by foundation
const marginFees = (fees: bigint) => {
  return (fees * 11n) / 10n;
};

export {
  buildTransaction,
  calculateAccountState,
  createStarknetAccount,
  marginFees,
  starkScanToAdamikTransaction,
};
