import { isAddress as isValidAddress } from "viem";
import { PlainTransaction, TransactionStatus, ErrorMsg, TransactionMode } from "~/app/model/types_WIP";
import { prevalidateTransactionCommon } from "../../common";
import { getMaxSpendable } from "../logic";
import { EvmService } from ".";

async function prevalidateTransaction(
  this: EvmService,
  transaction: PlainTransaction
): Promise<TransactionStatus> {
  return prevalidateTransactionCommon(transaction, async (address: string) => isValidAddress(address));
}

export { prevalidateTransaction };
