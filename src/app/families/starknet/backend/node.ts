import {
  Contract,
  DeployAccountContractTransaction,
  ec,
  Invocation,
  InvocationsDetailsWithNonce,
  Provider,
} from "starknet";
import { CHAINS } from "~/app/config/chains";
import { AccountState, TransactionMode } from "~/app/model/types_WIP";
import { StarknerTransactionParamsToBroadcast } from "../types";

const broadcast = async (signedTransaction: string): Promise<string> => {
  const transactionParams: StarknerTransactionParamsToBroadcast = JSON.parse(signedTransaction);

  const signature = ec.starkCurve.Signature.fromDER(transactionParams.payload?.signature ?? "");

  const provider = new Provider({
    nodeUrl: CHAINS.starknet.backends.nodeURL,
  });

  if (transactionParams.mode === TransactionMode.DEPLOY_ACCOUNT) {
    const result = await provider.deployAccountContract(
      { ...transactionParams.payload, signature } as DeployAccountContractTransaction,
      transactionParams.details as InvocationsDetailsWithNonce
    );

    return result.transaction_hash;
  } else if ([TransactionMode.TRANSFER, TransactionMode.TRANSFER_TOKEN].includes(transactionParams.mode)) {
    const result = await provider.invokeFunction(
      { ...transactionParams.payload, signature } as Invocation,
      transactionParams.details as InvocationsDetailsWithNonce
    );

    return result.transaction_hash;
  }

  return "";
};

const fetchAccount = async (accountId: string): Promise<AccountState> => {
  const provider = new Provider({
    nodeUrl: CHAINS.starknet.backends.nodeURL,
  });

  const starknetTokenContractId = "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d"; // starknet token contract id
  const { abi: starknetTokenABI } = await provider.getClassAt(starknetTokenContractId);
  const starknetTokenContract = new Contract(starknetTokenABI, starknetTokenContractId, provider);
  const balance = await starknetTokenContract.balanceOf(accountId);

  return {
    balances: {
      native: {
        available: balance,
        total: balance,
      },
    },
  };
};

export { broadcast, fetchAccount };
