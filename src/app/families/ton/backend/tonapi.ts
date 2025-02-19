import { Account, JettonInfo, JettonsBalances, Seqno, TonApiClient, Transaction } from "@ton-api/client";
import { Address } from "@ton/ton";
import { TON_API_KEY } from "~/app/config/apiKeys";
import { CHAINS } from "~/app/config/chains";
import { ThirdPartyProviderError } from "~/app/tools/handlers/errors";

const api = new TonApiClient({
  baseUrl: `${CHAINS.ton.backends.explorerURL}`,
  apiKey: TON_API_KEY,
});

async function fetchAccount(address: string): Promise<Account> {
  const tonAddress = Address.parse(address);

  try {
    return await api.accounts.getAccount(tonAddress);
  } catch (e) {
    console.warn(`/!\\ Failed to fetch TON account '${address}':`, e);
    throw new ThirdPartyProviderError(`TON account '${address}' not found on explorer`);
  }
}

async function getSeqno(address: string): Promise<bigint | null> {
  const tonAddress = Address.parse(address);

  let seqNo: Seqno;
  try {
    seqNo = await api.wallet.getAccountSeqno(tonAddress);

    return seqNo?.seqno ? BigInt(seqNo.seqno) : null;
  } catch (e) {
    console.warn(`/!\\ Failed to fetch TON seqno for wallet address '${address}':`, e);
    throw new ThirdPartyProviderError(`Error while fetching data from explorer for ton account '${address}'`);
  }
}

async function getJettonsFromWallet(address: string): Promise<JettonsBalances> {
  const tonAddress = Address.parse(address);

  try {
    return await api.accounts.getAccountJettonsBalances(tonAddress);
  } catch (e) {
    console.warn(`/!\\ Failed to fetch TON tokens for wallet address '${address}':`, e);
    throw new ThirdPartyProviderError(`Error while fetching data from explorer for ton account '${address}'`);
  }
}

async function getJettonInfo(jettonAddress: string): Promise<JettonInfo> {
  const tonAddress = Address.parse(jettonAddress);

  try {
    return await api.jettons.getJettonInfo(tonAddress);
  } catch (e) {
    console.warn(`/!\\ Failed to fetch TON token '${jettonAddress}':`, e);
    throw new ThirdPartyProviderError(
      `Error while fetching data from explorer for token address '${jettonAddress}'`
    );
  }
}

async function fetchTransaction(hash: string): Promise<Transaction> {
  try {
    return await api.blockchain.getBlockchainTransaction(hash);
  } catch (e) {
    console.warn(`/!\\ Failed to fetch TON transaction '${hash}':`, e);
    throw new ThirdPartyProviderError(
      `Error while fetching data from explorer for ton transaction '${hash}'`
    );
  }
}

export { fetchAccount, fetchTransaction, getJettonInfo, getJettonsFromWallet, getSeqno };
