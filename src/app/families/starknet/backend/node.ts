import { Contract, ec, RpcError, shortString, Provider as StarknetProvider } from "starknet";
import { ChainId, ProviderType, TransactionMode } from "~/app/model/types_WIP";
import { InvalidTransactionError, ThirdPartyProviderError } from "~/app/tools/handlers/errors";
import { getProviderUrls } from "../../common";
import { STARK_TOKEN_CONTRACT_ID } from "../constants";
import { createStarknetAccount, isCompactSignature, marginFees } from "../logic";
import { StarknetTransactionParams } from "../types";

const fetchTokenInfo = async (chainId: ChainId, tokenId: string) => {
  const nodeUrl = getProviderUrls(chainId, ProviderType.node);

  if (!nodeUrl) {
    throw new ThirdPartyProviderError("No node URL found for Starknet");
  }

  // TODO: Add support for multiple node URLs
  const provider = new StarknetProvider({
    nodeUrl: typeof nodeUrl === "string" ? nodeUrl : nodeUrl[0],
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

const broadcast = async (chainId: ChainId, signedTransaction: string): Promise<string> => {
  const nodeUrl = getProviderUrls(chainId, ProviderType.node);

  if (!nodeUrl) {
    throw new ThirdPartyProviderError("No node URL found for Starknet");
  }

  try {
    const { mode, payload, details }: StarknetTransactionParams = JSON.parse(signedTransaction);

    if (!payload.signature) {
      throw new InvalidTransactionError({
        errors: [{ message: "Signature is required" }],
        warnings: [],
      });
    }

    const signature = isCompactSignature(payload.signature)
      ? ec.starkCurve.Signature.fromCompact(payload.signature)
      : ec.starkCurve.Signature.fromDER(payload.signature);

    // TODO: Add support for multiple node URLs
    const provider = new StarknetProvider({
      nodeUrl: typeof nodeUrl === "string" ? nodeUrl : nodeUrl[0],
    });

    const providerFunction =
      mode === TransactionMode.DEPLOY_ACCOUNT ? provider.deployAccountContract : provider.invokeFunction;

    const result = await providerFunction({ ...payload, signature }, details);

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

const getNonce = async (chainId: ChainId, address: string) => {
  const nodeUrl = getProviderUrls(chainId, ProviderType.node);

  if (!nodeUrl) {
    throw new ThirdPartyProviderError("No node URL found for Starknet");
  }

  // TODO: Add support for multiple node URLs
  const provider = new StarknetProvider({
    nodeUrl: typeof nodeUrl === "string" ? nodeUrl : nodeUrl[0],
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
  chainId: ChainId,
  sender: string,
  recipient: string,
  amount: bigint,
  contractId: string
) => {
  const nodeUrl = getProviderUrls(chainId, ProviderType.node);

  if (!nodeUrl) {
    throw new ThirdPartyProviderError("No node URL found for Starknet");
  }

  // TODO: Add support for multiple node URLs
  const provider = new StarknetProvider({
    nodeUrl: typeof nodeUrl === "string" ? nodeUrl : nodeUrl[0],
  });
  const account = await createStarknetAccount(provider, sender);

  const transferCall = await populateTransferCall(contractId, recipient, amount, provider);
  const fee = await account.estimateInvokeFee(transferCall, { version: "0x3" });

  const marginedFee = marginFees(fee.suggestedMaxFee);

  return marginedFee;
};

const buildTransferPayload = async (
  chainId: ChainId,
  sender: string,
  recipient: string,
  amount: bigint,
  contractId: string
) => {
  // TODO: Add support for multiple node URLs\
  const nodeUrl = getProviderUrls(chainId, ProviderType.node);

  if (!nodeUrl) {
    throw new ThirdPartyProviderError("No node URL found for Starknet");
  }

  const provider = new StarknetProvider({
    nodeUrl: typeof nodeUrl === "string" ? nodeUrl : nodeUrl[0],
  });
  const nonce = await provider.getNonceForAddress(sender);

  const account = await createStarknetAccount(provider, sender);

  const transferCall = await populateTransferCall(contractId, recipient, amount, provider);

  const payload = await account.getExecutePayloadToSign(transferCall, { nonce, version: "0x3" });

  return payload;
};

const buildStakePayload = async (chainId: ChainId, poolAddress: string, sender: string, amount: BigInt) => {
  // TODO: Add support for multiple node URLs
  const nodeUrl = getProviderUrls(chainId, ProviderType.node);

  if (!nodeUrl) {
    throw new ThirdPartyProviderError("No node URL found for Starknet");
  }

  const provider = new StarknetProvider({
    nodeUrl: typeof nodeUrl === "string" ? nodeUrl : nodeUrl[0],
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
