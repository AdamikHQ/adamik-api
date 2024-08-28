import { Api, TonApiClient } from "@ton-api/client";
import { Address, Cell, JettonMaster, TonClient } from "@ton/ton";
import { TON_API_KEY, TON_CENTER_KEY } from "~/app/config/apiKeys";
import { CHAINS } from "~/app/config/chains";

// Configure the HTTP client with your host and token
const nodeClient = new TonClient({
  endpoint: `${CHAINS.ton.backends.nodeURL}v2/jsonRPC`,
  apiKey: TON_CENTER_KEY,
});

const http = new TonApiClient({
  baseUrl: `${CHAINS.ton.backends.explorerURL}`,
  apiKey: TON_API_KEY,
});

const api = new Api(http);

export const fetchAccount = async (accountId: string) => {
  const tonAddress = Address.parse(accountId);

  const info = await api.accounts.getAccount(tonAddress);
  return info;
};

export const getSeqno = async (address: string) => {
  const tonAddress = Address.parse(address);

  const seqNo = await api.wallet.getAccountSeqno(tonAddress);

  return BigInt(seqNo.seqno);
};

export const estimateFees = async (
  contractAddress: string,
  body: Cell,
  init?: { code: Cell; data: Cell }
) => {
  const tonAddress = Address.parse(contractAddress);

  const fee = await nodeClient.estimateExternalMessageFee(tonAddress, {
    body,
    ignoreSignature: true,
    initData: init?.data || null,
    initCode: init?.code || null,
  });

  return fee;
};

// https://docs.ton.org/develop/dapps/cookbook#how-to-calculate-users-jetton-wallet-address-offchain
export const getWalletJetonAddress = async (
  userWalletAddress: string,
  jettonAddress: string
): Promise<Address> => {
  const userAddress = Address.parse(userWalletAddress);
  const jettonMasterAddress = Address.parse(jettonAddress);

  const jettonMaster = nodeClient.open(JettonMaster.create(jettonMasterAddress));
  return await jettonMaster.getWalletAddress(userAddress);
};

export const getJettonsFromWallet = async (address: string) => {
  const tonAddress = Address.parse(address);

  const jettons = await api.accounts.getAccountJettonsBalances(tonAddress);

  return jettons;
};

export const getJettonInfo = async (jettonAddress: string) => {
  const tonAddress = Address.parse(jettonAddress);

  const jetton = await api.jettons.getJettonInfo(tonAddress);

  return jetton;
};

export const broadcast = async (transaction: string) => {
  const data = await fetch(`${CHAINS.ton.backends.nodeURL}v2/sendBocReturnHash`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": TON_CENTER_KEY,
    },
    body: JSON.stringify({
      boc: transaction,
    }),
  }).then((response) => response.json());

  if (data.ok === false) {
    console.warn(`ton broadcast - encountered issue: ${data.error}`);
    throw new Error(data.error);
  }
  return data.result.hash;
};
