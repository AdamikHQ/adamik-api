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
import { TokenBalance, TransactionResponse } from "./backend/types";
import { STARK_TOKEN_CONTRACT_ID } from "./constants";
import { ArgentX } from "./contracts/argentx";
import { buildTransferPayload } from "./contracts/logic";

const buildTransaction = async (transaction: Transaction) => {
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
  };

  if (transaction.transaction_execution_status === "SUCCEEDED") {
    parsedTransaction.state = TransactionState.CONFIRMED;
    parsedTransaction.blockHeight = BigInt(transaction.block_number);
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

export { buildTransaction, calculateAccountState, starkScanToAdamikTransaction };
