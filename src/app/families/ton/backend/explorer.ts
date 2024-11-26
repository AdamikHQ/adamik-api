import { Account, Api, JettonInfo, JettonsBalances, Seqno, TonApiClient, Transaction } from "@ton-api/client";
import { Address } from "@ton/ton";
import { TON_API_KEY } from "~/app/config/apiKeys";
import { CHAINS } from "~/app/config/chains";

const http = new TonApiClient({
  baseUrl: `${CHAINS.ton.backends.explorerURL}`,
  apiKey: TON_API_KEY,
});

const api = new Api(http);

async function fetchAccount(accountId: string): Promise<Account> {
  const tonAddress = Address.parse(accountId);

  try {
    return await api.accounts.getAccount(tonAddress);
  } catch (e) {
    console.warn(`/!\\ Failed to fetch TON account '${accountId}':`, e);
    throw new Error("TON account not found");
  }
}

async function getSeqno(address: string): Promise<bigint | null> {
  const tonAddress = Address.parse(address);

  let seqNo: Seqno;
  try {
    seqNo = await api.wallet.getAccountSeqno(tonAddress);
  } catch (e) {
    console.warn(`/!\\ Failed to fetch TON seqno for wallet address '${address}':`, e);
    return null;
  }
  return seqNo?.seqno ? BigInt(seqNo.seqno) : null;
}

async function getJettonsFromWallet(address: string): Promise<JettonsBalances | null> {
  const tonAddress = Address.parse(address);

  try {
    return await api.accounts.getAccountJettonsBalances(tonAddress);
  } catch (e) {
    console.warn(`/!\\ Failed to fetch TON tokens for wallet address '${address}':`, e);
    return null;
  }
}

async function getJettonInfo(jettonAddress: string): Promise<JettonInfo | null> {
  const tonAddress = Address.parse(jettonAddress);

  try {
    return await api.jettons.getJettonInfo(tonAddress);
  } catch (e) {
    console.warn(`/!\\ Failed to fetch TON token '${jettonAddress}':`, e);
    return null;
  }
}

async function fetchTransaction(hash: string): Promise<Transaction | null> {
  try {
    return await api.blockchain.getBlockchainTransaction(hash);
  } catch (e) {
    console.warn(`/!\\ Failed to fetch TON transaction '${hash}':`, e);
    return null;
  }
}

export { fetchAccount, fetchTransaction, getJettonInfo, getJettonsFromWallet, getSeqno };
