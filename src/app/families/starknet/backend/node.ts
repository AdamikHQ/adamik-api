import {
  Contract,
  DeployAccountContractTransaction,
  ec,
  Invocation,
  InvocationsDetailsWithNonce,
  Provider,
  RpcError,
  shortString,
} from "starknet";
import { CHAINS } from "~/app/config/chains";
import { TransactionMode } from "~/app/model/types_WIP";
import { InvalidTransactionError } from "~/app/tools/handlers/errors";
import { STARK_TOKEN_CONTRACT_ID } from "../constants";
import { createStarknetAccount, marginFees } from "../logic";
import { StarknetTransactionParamsToBroadcast } from "../types";

const fetchTokenInfo = async (tokenId: string) => {
  const provider = new Provider({
    nodeUrl: CHAINS.starknet.backends.nodeURL,
  });

  const token = await provider.getClassAt(tokenId);

  const tokenInfo = new Contract(token.abi, tokenId, provider);

  const name = await tokenInfo.name();
  const symbol = await tokenInfo.symbol();
  const decimals = await tokenInfo.decimals();

  return {
    id: tokenId,
    name: shortString.isDecimalString(name) ? shortString.decodeShortString(name) : "",
    ticker: shortString.isDecimalString(symbol) ? shortString.decodeShortString(symbol) : "",
    decimals: decimals.toString(),
  };
};

const broadcast = async (signedTransaction: string): Promise<string> => {
  try {
    const transactionParams: StarknetTransactionParamsToBroadcast = JSON.parse(signedTransaction);

    const signature = ec.starkCurve.Signature.fromDER(transactionParams.payload?.signature ?? "");

    if (!signature) {
      throw new InvalidTransactionError({
        errors: [{ message: "Signature is required" }],
        warnings: [],
      });
    }

    const provider = new Provider({
      nodeUrl: CHAINS.starknet.backends.nodeURL,
    });

    if (transactionParams.mode === TransactionMode.DEPLOY_ACCOUNT) {
      const result = await provider.deployAccountContract(
        { ...transactionParams.payload, signature } as DeployAccountContractTransaction,
        transactionParams.details as InvocationsDetailsWithNonce
      );

      return result.transaction_hash;
    }

    const result = await provider.invokeFunction(
      { ...transactionParams.payload, signature } as Invocation,
      transactionParams.details as InvocationsDetailsWithNonce
    );

    return result.transaction_hash;
  } catch (error) {
    if (error instanceof RpcError) {
      throw new InvalidTransactionError({
        errors: [{ message: error.message }],
        warnings: [],
      });
    }

    throw error;
  }
};

const getNonce = async (address: string) => {
  const provider = new Provider({
    nodeUrl: CHAINS.starknet.backends.nodeURL,
  });

  try {
    const nonce = await provider.getNonceForAddress(address);
    return nonce;
  } catch (error) {
    if (error instanceof RpcError) {
      if (error.message.includes("Contract not found")) {
        return 0;
      }
    }

    throw error;
  }
};

const populateTransferCall = async (
  contractId: string,
  recipient: string,
  amount: bigint,
  provider: Provider
) => {
  const { abi: ERC20Abi } = await provider.getClassAt(contractId);
  const starknetTokenContract = new Contract(ERC20Abi, contractId, provider);
  const transferCall = starknetTokenContract.populate("transfer", [recipient, amount.toString()]);
  return transferCall;
};

const estimateTransferFees = async (
  sender: string,
  recipient: string,
  amount: bigint,
  contractId: string
) => {
  const provider = new Provider({
    nodeUrl: CHAINS.starknet.backends.nodeURL,
  });
  const account = await createStarknetAccount(provider, sender);

  const transferCall = await populateTransferCall(contractId, recipient, amount, provider);
  const fee = await account.estimateInvokeFee(transferCall);

  const marginedFee = marginFees(fee.suggestedMaxFee);

  return marginedFee;
};

const buildTransferPayload = async (
  sender: string,
  recipient: string,
  amount: bigint,
  contractId: string
) => {
  const provider = new Provider({
    nodeUrl: CHAINS.starknet.backends.nodeURL,
  });
  const nonce = await provider.getNonceForAddress(sender);

  const account = await createStarknetAccount(provider, sender);

  const transferCall = await populateTransferCall(contractId, recipient, amount, provider);

  const payload = await account.getExecutePayloadToSign(transferCall, { nonce, version: "0x3" });
  return payload;
};

const buildStakePayload = async (poolAddress: string, sender: string, amount: BigInt) => {
  const provider = new Provider({
    nodeUrl: CHAINS.starknet.backends.nodeURL,
  });

  const nonce = await provider.getNonceForAddress(sender);
  const account = await createStarknetAccount(provider, sender);

  const { abi: starknetTokenABI } = await provider.getClassAt(STARK_TOKEN_CONTRACT_ID);
  const starknetTokenContract = new Contract(starknetTokenABI, STARK_TOKEN_CONTRACT_ID, provider);

  const { abi: poolAbi } = await provider.getClassAt(poolAddress);

  const poolContract = new Contract(poolAbi, poolAddress, provider);

  const poolMemberInfo = await poolContract.get_pool_member_info(BigInt(sender));
  if (poolMemberInfo.isSome()) {
    const approvePoolCall = starknetTokenContract.populate("approve", {
      spender: poolAddress,
      amount,
    });
    const delegateCall = poolContract.populate("add_to_delegation_pool", {
      pool_member: sender,
      amount,
    });

    const payload = await account.getExecutePayloadToSign([approvePoolCall, delegateCall], {
      nonce,
      version: "0x3",
    });

    return payload;
  } else {
    const approvePoolCall = starknetTokenContract.populate("approve", {
      spender: poolAddress,
      amount,
    });
    const delegateCall = poolContract.populate("enter_delegation_pool", {
      reward_address: sender,
      amount,
    });

    const payload = await account.getExecutePayloadToSign([approvePoolCall, delegateCall], {
      nonce,
      version: "0x3",
    });

    return payload;
  }
};

const buildUnstakePayload = async (poolAddress: string, sender: string, amount: BigInt) => {
  const provider = new Provider({
    nodeUrl: CHAINS.starknet.backends.nodeURL,
  });

  const { abi: poolAbi } = await provider.getClassAt(poolAddress);

  const poolContract = new Contract(poolAbi, poolAddress, provider);

  const nonce = await provider.getNonceForAddress(sender);
  const account = await createStarknetAccount(provider, sender);

  const memberPoolInfo = await poolContract.get_pool_member_info(sender);
  let poolTime = 0;
  if (memberPoolInfo.isSome()) {
    const infoPool = memberPoolInfo.unwrap();
    poolTime = infoPool.unpool_time.unwrap()?.seconds;
    const durationSec = Number(BigInt(poolTime)) - new Date().getTime() / 1000 + 60;

    if (durationSec > 0) {
      throw new InvalidTransactionError({
        errors: [
          {
            message: `Unstake is already in progress, please wait for ${durationSec} seconds to withdraw your staking position`,
          },
        ],
        warnings: [],
      });
    }
  }

  const unstakeInitCall = poolContract.populate("exit_delegation_pool_intent", {
    amount,
  });

  const payload = await account.getExecutePayloadToSign([unstakeInitCall], {
    nonce,
    version: "0x3",
  });

  return payload;
};

const buildWithdrawPayload = async (poolAddress: string, sender: string) => {
  const provider = new Provider({
    nodeUrl: CHAINS.starknet.backends.nodeURL,
  });

  const { abi: poolAbi } = await provider.getClassAt(poolAddress);

  const poolContract = new Contract(poolAbi, poolAddress, provider);

  const nonce = await provider.getNonceForAddress(sender);
  const account = await createStarknetAccount(provider, sender);

  const memberPoolInfo = await poolContract.get_pool_member_info(sender);
  let poolTime = 0;
  if (memberPoolInfo.isSome()) {
    const infoPool = memberPoolInfo.unwrap();
    poolTime = infoPool.unpool_time.unwrap()?.seconds;
    const durationSec = Number(BigInt(poolTime)) - new Date().getTime() / 1000 + 60;

    if (durationSec > 0) {
      throw new InvalidTransactionError({
        errors: [
          {
            message: `Pooltime is still in progress, please wait for ${durationSec} seconds to withdraw your staking position`,
          },
        ],
        warnings: [],
      });
    }
  }

  const partialWithdrawInitCall = poolContract.populate("exit_delegation_pool_action", {
    pool_member: sender,
  });

  const payload = await account.getExecutePayloadToSign([partialWithdrawInitCall], {
    nonce,
    version: "0x3",
  });

  return payload;
};

const buildClaimRewardsPayload = async (poolAddress: string, sender: string) => {
  const provider = new Provider({
    nodeUrl: CHAINS.starknet.backends.nodeURL,
  });

  const { abi: poolAbi } = await provider.getClassAt(poolAddress);

  const poolContract = new Contract(poolAbi, poolAddress, provider);

  const nonce = await provider.getNonceForAddress(sender);
  const account = await createStarknetAccount(provider, sender);

  const claimRewardsCall = poolContract.populate("claim_rewards", {
    staker_address: sender,
  });

  const payload = await account.getExecutePayloadToSign([claimRewardsCall], {
    nonce,
    version: "0x3",
  });

  return payload;
};

export {
  broadcast,
  buildClaimRewardsPayload,
  buildStakePayload,
  buildTransferPayload,
  buildUnstakePayload,
  buildWithdrawPayload,
  estimateTransferFees,
  fetchTokenInfo,
  getNonce,
};
