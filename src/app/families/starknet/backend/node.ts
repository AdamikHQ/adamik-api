import {
  Contract,
  DeployAccountContractTransaction,
  ec,
  Invocation,
  InvocationsDetailsWithNonce,
  RpcError,
  shortString,
  Provider as StarknetProvider,
} from "starknet";
import { CHAINS } from "~/app/config/chains";
import { Provider, ProviderType, TransactionMode } from "~/app/model/types_WIP";
import { InvalidTransactionError } from "~/app/tools/handlers/errors";
import { STARK_TOKEN_CONTRACT_ID } from "../constants";
import { createStarknetAccount, isCompactSignature, marginFees } from "../logic";
import { StarknetTransactionParamsToBroadcast } from "../types";

const nodeUrl = CHAINS.starknet.providers.find((p: Provider) => p.type === ProviderType.node)?.url;

const fetchTokenInfo = async (tokenId: string) => {
  const provider = new StarknetProvider({
    nodeUrl,
  });

  const token = await provider.getClassAt(tokenId);

  const tokenInfo = new Contract(token.abi, tokenId, provider);

  const [name, symbol, decimals] = await Promise.all([
    tokenInfo.name(),
    tokenInfo.symbol(),
    tokenInfo.decimals(),
  ]);

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

    if (!transactionParams.payload.signature) {
      throw new InvalidTransactionError({
        errors: [{ message: "Signature is required" }],
        warnings: [],
      });
    }

    const signature = isCompactSignature(transactionParams.payload.signature)
      ? ec.starkCurve.Signature.fromCompact(transactionParams.payload.signature)
      : ec.starkCurve.Signature.fromDER(transactionParams.payload.signature);

    const provider = new StarknetProvider({ nodeUrl });

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
  const provider = new StarknetProvider({
    nodeUrl,
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
  provider: StarknetProvider
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
  const provider = new StarknetProvider({
    nodeUrl,
  });
  const account = await createStarknetAccount(provider, sender);

  const transferCall = await populateTransferCall(contractId, recipient, amount, provider);
  const fee = await account.estimateInvokeFee(transferCall, { version: "0x3" });

  const marginedFee = marginFees(fee.suggestedMaxFee);

  return marginedFee;
};

const buildTransferPayload = async (
  sender: string,
  recipient: string,
  amount: bigint,
  contractId: string
) => {
  const provider = new StarknetProvider({
    nodeUrl,
  });
  const nonce = await provider.getNonceForAddress(sender);

  const account = await createStarknetAccount(provider, sender);

  const transferCall = await populateTransferCall(contractId, recipient, amount, provider);

  const payload = await account.getExecutePayloadToSign(transferCall, { nonce, version: "0x3" });

  console.log({ payload });

  return payload;
};

const buildStakePayload = async (poolAddress: string, sender: string, amount: BigInt) => {
  const provider = new StarknetProvider({
    nodeUrl,
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

export { broadcast, buildStakePayload, buildTransferPayload, estimateTransferFees, fetchTokenInfo, getNonce };
