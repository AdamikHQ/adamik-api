import { Contract, RpcError, stark } from "starknet";

import { Account } from "starknet";

import { CHAINS } from "~/app/config/chains";

import { Provider } from "starknet";
import { STARK_TOKEN_CONTRACT_ID } from "../constants";

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

const buildTransferPayload  = async (sender: string, recipient: string, amount: bigint, contractId: string) => {
  const provider = new Provider({
    nodeUrl: CHAINS.starknet.backends.nodeURL,
  });
  const nonce = await provider.getNonceForAddress(sender);

  const account = await createStarknetAccount(provider, sender);

  const transferCall = await populateTransferCall(contractId, recipient, amount, provider);

  const payload = await account.getExecutePayloadToSign(transferCall, { nonce, version: "0x3" });
  return payload;
};

// NOTE: WIP
const buildStakePayload  = async (amount: BigInt, sender: string, poolAddress: string) => {
  const provider = new Provider({
    nodeUrl: CHAINS.starknet.backends.nodeURL,
  });

  const nonce = await provider.getNonceForAddress(sender);
  const account = await createStarknetAccount(provider, sender);

  const { abi: starknetTokenABI } = await provider.getClassAt(STARK_TOKEN_CONTRACT_ID);
  const starknetTokenContract = new Contract(starknetTokenABI, STARK_TOKEN_CONTRACT_ID, provider);

  const { abi: poolAbi } = await provider.getClassAt(poolAddress);

  const poolContract = new Contract(poolAbi, poolAddress, provider);

  const info12 = await poolContract.get_pool_member_info(BigInt(sender));
  if (info12.isSome()) {
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

export { createStarknetAccount, estimateTransferFees, getNonce, marginFees, buildStakePayload , buildTransferPayload };
