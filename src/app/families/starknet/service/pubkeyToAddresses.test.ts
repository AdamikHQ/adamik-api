import { ec } from "starknet";
import { ArgentX } from "../contracts/argentx";
import { Braavos } from "../contracts/braavos";
import { OpenZeppelin } from "../contracts/openzeppelin";

describe("pubkeyToAddresses", () => {
  const randomEmptyPrivateKey = "0x29ddb72671b1e5c9b7ad8b8dbb737ca7a7bd37fbb1cc271bc38980f2ec500be";

  it("should compute openzeppelin address", () => {
    // pubkey : 0x2d3cccf309a128d4722f652da707cc78ed05c056142b6c1b42eba1e5096f002
    const pubkey = ec.starkCurve.getStarkKey(randomEmptyPrivateKey);

    const address = OpenZeppelin.generateAddress(pubkey);
    expect(address).toBe("0x62ebf7c3bae671029b5649e16ed97941c65c860be5e3242b5e91b08f8855d3");
  });

  it("should compute argent address", () => {
    // pubkey : 0x2d3cccf309a128d4722f652da707cc78ed05c056142b6c1b42eba1e5096f002
    const pubkey = ec.starkCurve.getStarkKey(randomEmptyPrivateKey);

    const address = ArgentX.generateAddress(pubkey);
    expect(address).toBe("0x16df623f0dcdd34c67c1fe9625303b74028c55f8df268193fdbc6b535694301");
  });

  it("should compute bravoos address", () => {
    // pubkey : 0x2d3cccf309a128d4722f652da707cc78ed05c056142b6c1b42eba1e5096f002
    const pubkey = ec.starkCurve.getStarkKey(randomEmptyPrivateKey);

    const address = Braavos.generateAddress(pubkey);
    expect(address).toBe("0xc4dca78cd9760f31df71fc2687fca5625e7a07350b5c47da88f8d15b4c548c");
  });
});
