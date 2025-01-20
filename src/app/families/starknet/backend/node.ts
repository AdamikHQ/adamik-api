import {
  DeployAccountContractTransaction,
  ec,
  Invocation,
  InvocationsDetailsWithNonce,
  Provider,
} from "starknet";
import { CHAINS } from "~/app/config/chains";
import { TransactionMode } from "~/app/model/types_WIP";
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
  } else if (transactionParams.mode === TransactionMode.TRANSFER) {
    const result = await provider.invokeFunction(
      { ...transactionParams.payload, signature } as Invocation,
      transactionParams.details as InvocationsDetailsWithNonce
    );

    return result.transaction_hash;
  }

  return "";
};

export { broadcast };
