import { Transaction, TransactionMode } from "~/app/model/types_WIP";
import { STARK_TOKEN_CONTRACT_ID } from "./constants";
import { ArgentX } from "./contracts/argentx";
import { transfer } from "./contracts/logic";

export const buildTransaction = async (transaction: Transaction) => {
  const { amount, recipient, sender, mode } = transaction.data;

  switch (mode) {
    case TransactionMode.TRANSFER: {
      if (!amount || !recipient || !sender) {
        throw new Error("Missing transaction data");
      }
      const payload = await transfer(sender, recipient, amount, STARK_TOKEN_CONTRACT_ID);

      return payload;
    }
    case TransactionMode.TRANSFER_TOKEN: {
      if (!amount || !recipient || !sender) {
        throw new Error("Missing transaction data");
      }
      const { tokenId } = transaction.data;
      const payload = await transfer(sender, recipient, amount, tokenId);

      return payload;
    }

    case TransactionMode.DEPLOY_WALLET_CONTRACT: {
      const { pubkey, type } = transaction.data;

      switch (type) {
        case "argentX": {
          const payload = await ArgentX.deployContractPayload(pubkey);
          return payload;
        }
        default: {
          throw new Error("Invalid contract type");
        }
      }
    }
  }
};
