import { Address, Cell, JettonMaster, TonClient } from "@ton/ton";
import { TON_CENTER_API_KEY } from "~/app/config/apiKeys";
import { CHAINS } from "~/app/config/chains";

// Configure the HTTP client with your host and token
const nodeClient = new TonClient({
  endpoint: `${CHAINS.ton.backends.nodeURL}v2/jsonRPC`,
  apiKey: TON_CENTER_API_KEY,
});

async function estimateFees(contractAddress: string, body: Cell, init?: { code: Cell; data: Cell }) {
  const tonAddress = Address.parse(contractAddress);

  const fee = await nodeClient.estimateExternalMessageFee(tonAddress, {
    body,
    ignoreSignature: true,
    initData: init?.data || null,
    initCode: init?.code || null,
  });

  return fee;
}

// https://docs.ton.org/develop/dapps/cookbook#how-to-calculate-users-jetton-wallet-address-offchain
async function getWalletJetonAddress(userWalletAddress: string, jettonAddress: string): Promise<Address> {
  const userAddress = Address.parse(userWalletAddress);
  const jettonMasterAddress = Address.parse(jettonAddress);

  const jettonMaster = nodeClient.open(JettonMaster.create(jettonMasterAddress));
  return await jettonMaster.getWalletAddress(userAddress);
}

// NOTE This API is not used by TON client-side SDK
async function broadcast(transaction: string) {
  const data = await fetch(`${CHAINS.ton.backends.nodeURL}v2/sendBocReturnHash`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": TON_CENTER_API_KEY,
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
}

export { broadcast, estimateFees, getWalletJetonAddress };
