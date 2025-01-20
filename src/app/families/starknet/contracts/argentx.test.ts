import { ec, Provider } from "starknet";
import { CHAINS } from "~/app/config/chains";
import { ArgentX } from "../contracts/argentx";

describe("ArgentX", () => {
  const randomEmptyPrivateKey = "0x05cd2079c22499cffbf6829e197184f66ddb0747c57c5875cdf70b8ced94b8ba";

  it("it should deploy argentX contract if new otherwise it should fail", async () => {
    const pubkey = ec.starkCurve.getStarkKey(randomEmptyPrivateKey);
    console.log(pubkey);
    const address = ArgentX.generateAddress(pubkey);
    console.log(address);
    const payload = await ArgentX.deployContractPayload(pubkey);

    console.log(payload);
    // const signature = ec.starkCurve.sign(payload.payload.toSign, randomEmptyPrivateKey);

    // const provider = new Provider({
    //   nodeUrl: CHAINS.starknet.backends.nodeURL,
    // });

    // const result = await provider.deployAccountContract(
    //   { ...payload.payload, signature: signature },
    //   payload.details
    // );
    // console.log("✅ ArgentX wallet deployed at:", result);
  });

  it.only("should transfer from argentX to another argentX", async () => {
    const signature = ec.starkCurve.sign(
      "0x1a5c79c72e207d9eb5275c9e70d99ee9a29769d346170c542f606983a933b2e",
      randomEmptyPrivateKey
    );

    console.log(signature.toDERHex());

    console.log("compact");
    console.log(signature.toCompactHex());
  });

  it("should transfer from eth with argentX", async () => {
    const pubkey = ec.starkCurve.getStarkKey(randomEmptyPrivateKey);

    const argentXAddress = ArgentX.generateAddress(pubkey);

    const payload = await ArgentX.transferETH(
      "0x7298c56997f28eeddce2d4d75bea4e1805f5021a4fa3690cfa6f68e90b8f6b2",
      BigInt("1000000000"),
      argentXAddress
    );

    console.log(payload);

    const signature = ec.starkCurve.sign(payload.payload.toSign, randomEmptyPrivateKey);

    console.log(signature);

    const provider = new Provider({
      nodeUrl: CHAINS.starknet.backends.nodeURL,
    });

    const result = await provider.invokeFunction({ ...payload.payload, signature }, payload.details);

    console.log(result);
  });

  it("should stake from strk with argentX", async () => {
    const pubkey = ec.starkCurve.getStarkKey(randomEmptyPrivateKey);

    const argentXAddress = ArgentX.generateAddress(pubkey);

    const payload = await ArgentX.stakeSTRK(BigInt("100000000000"), argentXAddress);

    console.log(payload);

    const signature = ec.starkCurve.sign(payload.payload.toSign, randomEmptyPrivateKey);

    console.log(signature);

    const provider = new Provider({
      nodeUrl: CHAINS.starknet.backends.nodeURL,
    });

    const result = await provider.invokeFunction({ ...payload.payload, signature }, payload.details);

    console.log(result);
  });
});
