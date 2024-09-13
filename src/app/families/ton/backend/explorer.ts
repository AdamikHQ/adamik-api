import { Api, TonApiClient } from "@ton-api/client";
import { Address } from "@ton/ton";
import { TON_API_KEY } from "~/app/config/apiKeys";
import { CHAINS } from "~/app/config/chains";

const http = new TonApiClient({
  baseUrl: `${CHAINS.ton.backends.explorerURL}`,
  apiKey: TON_API_KEY,
});

const api = new Api(http);

async function fetchAccount(accountId: string) {
  const tonAddress = Address.parse(accountId);

  const info = await api.accounts.getAccount(tonAddress);
  return info;
}

async function getSeqno(address: string) {
  const tonAddress = Address.parse(address);

  const seqNo = await api.wallet.getAccountSeqno(tonAddress);

  return BigInt(seqNo.seqno);
}

async function getJettonsFromWallet(address: string) {
  const tonAddress = Address.parse(address);

  const jettons = await api.accounts.getAccountJettonsBalances(tonAddress);

  return jettons;
}

async function getJettonInfo(jettonAddress: string) {
  const tonAddress = Address.parse(jettonAddress);

  const jetton = await api.jettons.getJettonInfo(tonAddress);

  return jetton;
}

async function fetchTransaction(hash: string) {
  const tx = await api.blockchain.getBlockchainTransaction(hash);

  return tx;
}

export { fetchAccount, fetchTransaction, getJettonInfo, getJettonsFromWallet, getSeqno };
