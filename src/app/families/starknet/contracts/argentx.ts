import {
  CairoCustomEnum,
  CairoOption,
  CairoOptionVariant,
  CallData,
  DeployAccountContractTransaction,
  encode,
  hash,
  InvocationsDetailsWithNonce,
  Provider,
  RawArgs,
} from "starknet";
import { CHAINS } from "~/app/config/chains";
import { createStarknetAccount, marginFees } from "./logic";
import { generateAddress, getDeployContractPayload } from "./types";

const ArgentXAccountClassHash = "0x036078334509b514626504edc9fb252328d1a240e4e948bef8d0c08dff45927f";

class ArgentX {
  private static getConstructorCallData = (pubkey: string): RawArgs => {
    const axSigner = new CairoCustomEnum({ Starknet: { pubkey: pubkey } });
    const axGuardian = new CairoOption<unknown>(CairoOptionVariant.None);
    const AXConstructorCallData = CallData.compile({
      owner: axSigner,
      guardian: axGuardian,
    });

    return AXConstructorCallData;
  };

  static generateAddress: generateAddress = (pubkey: string): string => {
    const AXConstructorCallData = this.getConstructorCallData(pubkey);

    const AXcontractAddress = hash.calculateContractAddressFromHash(
      pubkey,
      ArgentXAccountClassHash,
      AXConstructorCallData,
      0
    );

    return encode.sanitizeHex(AXcontractAddress);
  };

  static getDeployContractPayload: getDeployContractPayload = async (
    pubkey: string
  ): Promise<{
    payload: Omit<DeployAccountContractTransaction, "signature"> & {
      toSign: string;
    };
    details: InvocationsDetailsWithNonce;
  }> => {
    const provider = new Provider({
      nodeUrl: CHAINS.starknet.backends.nodeURL,
    });

    const account = await createStarknetAccount(provider, ArgentXAccountClassHash);

    const sanitizedPubkey = encode.sanitizeHex(pubkey);
    const AXConstructorCallData = this.getConstructorCallData(sanitizedPubkey);

    const payload = await account.getDeployAccountPayloadToSign(
      {
        classHash: ArgentXAccountClassHash,
        addressSalt: sanitizedPubkey,
        constructorCalldata: AXConstructorCallData,
        contractAddress: ArgentX.generateAddress(sanitizedPubkey),
      },
      { version: "0x3" } // version 3
    );

    return payload;
  };

  static estimateDeployFees = async (pubkey: string): Promise<bigint> => {
    const provider = new Provider({
      nodeUrl: CHAINS.starknet.backends.nodeURL,
    });

    const sanitizedPubkey = encode.sanitizeHex(pubkey);

    const account = await createStarknetAccount(provider, ArgentXAccountClassHash);

    const AXConstructorCallData = this.getConstructorCallData(sanitizedPubkey);

    const fees = await account.estimateAccountDeployFee({
      classHash: ArgentXAccountClassHash,
      addressSalt: sanitizedPubkey,
      constructorCalldata: AXConstructorCallData,
      contractAddress: ArgentX.generateAddress(sanitizedPubkey),
    });

    const marginedFees = marginFees(fees.suggestedMaxFee);

    return marginedFees;
  };
}

export { ArgentX };
