import { ethers } from "ethers";
import { ec, encode, Provider } from "starknet";
import { CHAINS } from "~/app/config/chains";
import { ArgentX } from "../contracts/argentx";

describe("ArgentX", () => {
  const randomEmptyPrivateKey = "0x0534afe04050e6f010ce72056ee694f84a7ad3c84747f00be64d671c53039fa1";

  it.only("it should deploy argentX contract if new otherwise it should fail", async () => {
    const pubkey = ec.starkCurve.getStarkKey(randomEmptyPrivateKey);
    console.log(pubkey);
    const test = ethers.encodeBase58(encode.sanitizeHex(pubkey));
    console.log(test);
    const payload = await ArgentX.deployContractPayload(pubkey);

    const signature = ec.starkCurve.sign(payload.payload.toSign, randomEmptyPrivateKey);

    const provider = new Provider({
      nodeUrl: CHAINS.starknet.backends.nodeURL,
    });

    const result = await provider.deployAccountContract(
      { ...payload.payload, signature: signature },
      payload.details
    );
    console.log("✅ ArgentX wallet deployed at:", result);
  });
});
