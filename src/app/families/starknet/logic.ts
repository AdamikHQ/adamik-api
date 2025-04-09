import { Account, Provider, stark } from "starknet";
import {
  AccountState,
  DeployContractType,
  TokenAmount,
  TokenType,
  Transaction,
  TransactionMode,
} from "~/app/model/types_WIP";
import { fetchTokenBalances, fetchTokenContract } from "./backend/indexer";
import { buildTransferPayload, fetchTokenInfo } from "./backend/node";
import { TokenBalance } from "./backend/types";
import { STARK_TOKEN_CONTRACT_ID } from "./constants";
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
  const { balances } = await fetchTokenBalances(accountId);

  return {
    balances: {
      native: starknetTokenToAmount(balances),
      tokens: await mapTokenBalancesToTokenAmounts(balances),
    },
  };
}

async function mapTokenBalancesToTokenAmounts(tokenBalances: TokenBalance[]): Promise<TokenAmount[]> {
  return await Promise.all(
    tokenBalances
      .filter((tokenBalance) => tokenBalance.contract_address !== STARK_TOKEN_CONTRACT_ID)
      .map(async (tokenBalance) => {
        const tokenContract = await fetchTokenContract(tokenBalance.contract_address);

        // NOTE : Fallback to node if indexer doesn't return any name or symbol
        if (tokenContract?.name === null || tokenContract?.symbol === null) {
          const tokenContractByNode = await fetchTokenInfo(tokenBalance.contract_address);
          return {
            amount: BigInt(tokenBalance.balance),
            token: {
              type: TokenType.ERC20,
              id: tokenBalance.contract_address,
              name: tokenContractByNode.name,
              ticker: tokenContractByNode.ticker,
              decimals: Number(tokenContractByNode.decimals),
            },
          };
        }

        return {
          amount: BigInt(tokenBalance.balance),
          token: {
            type: TokenType.ERC20, // not so sure about this
            id: tokenBalance.contract_address,
            name: tokenContract?.name ?? "",
            ticker: tokenContract?.symbol ?? "",
            decimals: Number(tokenContract?.decimals ?? 0),
          },
        };
      })
  );
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

const isDERSignature = (signature: string) => {
  const sigBytes =
    typeof signature === "string" ? Buffer.from(signature.replace("0x", ""), "hex") : signature;
  return sigBytes[0] === 0x30;
};

const isCompactSignature = (signature: string) => {
  const sigBytes =
    typeof signature === "string" ? Buffer.from(signature.replace("0x", ""), "hex") : signature;
  return sigBytes.length === 64 || sigBytes.length === 65;
};

export {
  buildTransaction,
  calculateAccountState,
  createStarknetAccount,
  isCompactSignature,
  isDERSignature,
  mapTokenBalancesToTokenAmounts,
  marginFees,
};
