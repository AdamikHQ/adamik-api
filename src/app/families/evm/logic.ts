import { BaseError as ViemError } from "viem";
import { CHAINS } from "~/app/config/chains";
import { ChainId, Transaction, TransactionMode, TransactionSpendableAmounts } from "~/app/model/types_WIP";
import { EvmAddress, EvmChainParams } from "./types";
import {
  estimateERC20FeesForL2,
  estimateERC20Gas,
  estimateFeesForL2,
  estimateFeesPerGas,
  estimateGas,
  getBalance,
  getERC20Balance,
} from "./backend/node";
import { EtherscanERC20Event } from "./backend/types";

async function getTransactionGas(chainId: ChainId, transaction: Transaction["data"]): Promise<bigint> {
  if (transaction.mode === TransactionMode.TRANSFER_TOKEN) {
    return await estimateERC20Gas({
      chainId,
      contractAddress: transaction.tokenId as EvmAddress,
      senderAddress: transaction.sender as EvmAddress,
      recipientAddress: transaction.recipients[0].address as EvmAddress,
      amount: transaction.recipients[0].amount ?? 0n, // TODO: check if this is ok to have an empty amount
    });
  } else {
    return await estimateGas({
      chainId,
      senderAddress: transaction.sender as EvmAddress,
      recipientAddress: transaction.recipients[0].address as EvmAddress,
      amount: transaction.recipients[0].amount ?? 0n, // TODO: check if this is ok to have an empty amount
    });
  }
}

async function getTransactionFees(chainId: ChainId, transaction: Transaction["data"]): Promise<bigint> {
  const chainParams = CHAINS[chainId].params as EvmChainParams;

  if (chainParams?.isL2Fees) {
    return transaction.mode === TransactionMode.TRANSFER_TOKEN
      ? await estimateERC20FeesForL2({
          chainId,
          contractAddress: transaction.tokenId as EvmAddress,
          senderAddress: transaction.sender as EvmAddress,
          recipientAddress: transaction.recipients[0].address as EvmAddress,
          amount: transaction.recipients[0].amount ?? 0n, // TODO: check if this is ok to have an empty amount
        })
      : await estimateFeesForL2({
          chainId,
          senderAddress: transaction.sender as EvmAddress,
          recipientAddress: transaction.recipients[0].address as EvmAddress,
          amount: transaction.recipients[0].amount ?? 0n, // TODO: check if this is ok to have an empty amount
        });
  }

  if (!transaction.gas) {
    throw new Error("Missing gas from transaction to compute fees");
  }

  const { maxFeePerGas } = await estimateFeesPerGas(chainId);
  if (maxFeePerGas === undefined) {
    throw new Error("Could not retrieve maxFeePerGas");
  }

  return transaction.gas * maxFeePerGas;
}

async function getTransactionAmount(chainId: ChainId, transaction: Transaction["data"]): Promise<bigint> {
  if (!transaction.useMaxAmount) {
    if (!transaction.recipients[0].amount) {
      // should never happen, zod should have validated that we have an amount when useMaxAmount is false
      // TODO: make it more explicit through the type system
      throw new Error("Missing amount in recipient");
    }
    return transaction.recipients[0].amount;
  }

  if (transaction.mode === TransactionMode.TRANSFER_TOKEN) {
    const maxSpendable = await getMaxSpendable(chainId, transaction);
    return maxSpendable.token!;
  } else {
    const maxSpendable = await getMaxSpendable(chainId, transaction);
    return maxSpendable.native - transaction.fees >= 0n ? maxSpendable.native - transaction.fees : 0n;
  }
}

async function getMaxSpendable(
  chainId: ChainId,
  transaction: Transaction["data"]
): Promise<TransactionSpendableAmounts> {
  const ethBalance = await getBalance(chainId, transaction.sender as EvmAddress);

  if (transaction.mode === TransactionMode.TRANSFER_TOKEN) {
    try {
      const erc20Balance = await getERC20Balance({
        chainId,
        contractAddress: transaction.tokenId as EvmAddress,
        senderAddress: transaction.sender as EvmAddress,
      });
      return {
        native: ethBalance,
        token: erc20Balance,
      };
    } catch (e) {
      // An error from Viem here likely just means the address doesn't hold the token
      if (!(e instanceof ViemError)) {
        throw e;
      }
    }
  }

  return { native: ethBalance };
}

// For each unique contract address in the list of events,
// store one arbitray event that's linked to that contract address.
// Since events contain token info, this allows to build the list of tokens linked to an address
function getOneEventPerContractAddress(events: EtherscanERC20Event[]): Map<EvmAddress, EtherscanERC20Event> {
  const eventPerContractAddress = new Map<EvmAddress, any>();
  for (const event of events) {
    if (!eventPerContractAddress.has(event.contractAddress)) {
      eventPerContractAddress.set(event.contractAddress, event);
    }
  }
  return eventPerContractAddress;
}

export {
  getTransactionGas,
  getTransactionFees,
  getTransactionAmount,
  getMaxSpendable,
  getOneEventPerContractAddress,
};
