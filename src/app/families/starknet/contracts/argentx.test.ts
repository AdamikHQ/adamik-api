import { ec } from "starknet";

// This test will only help to provide signature for any transaction on starknet,
// you will need to paste your private key in allow to sign transaction
describe("ArgentX", () => {
  const randomEmptyPrivateKey = "0x0534afe04050e6f010ce72056ee694f84a7ad3c84747f00be64d671c53039fa1";

  it.skip("should transfer from argentX to another argentX", async () => {
    const signature = ec.starkCurve.sign(
      "0x75e9ceb2ff0d6f65766dbb1d7fa589c3f907ef75668459a2c60af9e2f42bb42",
      randomEmptyPrivateKey
    );

    console.log(signature.toDERHex());
  });
});
