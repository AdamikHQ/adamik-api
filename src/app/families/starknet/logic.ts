import { DeployContractType, Transaction, TransactionMode } from "~/app/model/types_WIP";
import { STARK_TOKEN_CONTRACT_ID } from "./constants";
import { ArgentX } from "./contracts/argentx";
import { transfer } from "./contracts/logic";

export const buildTransaction = async (transaction: Transaction) => {
  const { amount, recipientAddress, senderAddress, mode } = transaction.data;

  switch (mode) {
    case TransactionMode.TRANSFER: {
      if (!amount || !recipientAddress || !senderAddress) {
        throw new Error("Missing transaction data");
      }
      const payload = await transfer(senderAddress, recipientAddress, amount, STARK_TOKEN_CONTRACT_ID);

      return payload;
    }
    case TransactionMode.TRANSFER_TOKEN: {
      if (!amount || !recipientAddress || !senderAddress) {
        throw new Error("Missing transaction data");
      }
      const { tokenId } = transaction.data;
      const payload = await transfer(senderAddress, recipientAddress, amount, tokenId);

      return payload;
    }

    case TransactionMode.DEPLOY_ACCOUNT: {
      const { senderPubKey, contractType } = transaction.data;
      switch (contractType) {
        case DeployContractType.ARGENTX: {
          const payload = await ArgentX.deployContractPayload(senderPubKey);
          return payload;
        }
        default: {
          throw new Error("Invalid contract type");
        }
      }
    }
  }
};
