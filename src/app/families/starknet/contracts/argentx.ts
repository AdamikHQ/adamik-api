import {
  CairoCustomEnum,
  CairoOption,
  CairoOptionVariant,
  CallData,
  encode,
  hash,
  num,
  RawArgs,
  Provider as StarknetProvider,
} from "starknet";
import { ChainId, ProviderType } from "~/app/model/types_WIP";
import { ThirdPartyProviderError } from "~/app/tools/handlers/errors";
import { getProviderUrls } from "../../common";
import { createStarknetAccount, marginFees } from "../logic";
import { StarknetTransactionParams } from "../types";

const ARGENT_X_CLASS_HASH = "0x036078334509b514626504edc9fb252328d1a240e4e948bef8d0c08dff45927f";

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

  static generateAddress = (pubkey: string): string => {
    const AXConstructorCallData = this.getConstructorCallData(pubkey);
    const AXcontractAddress = hash.calculateContractAddressFromHash(
      pubkey,
      ARGENT_X_CLASS_HASH,
      AXConstructorCallData,
      0
    );

    return num.toHex64(encode.sanitizeHex(AXcontractAddress));
  };

  static getDeployContractPayload = async (
    chainId: ChainId,
    pubkey: string
  ): Promise<StarknetTransactionParams> => {
    // TODO: Add support for multiple node URLs
    const nodeUrl = getProviderUrls(chainId, ProviderType.node);

    const provider = new StarknetProvider({
      nodeUrl: typeof nodeUrl === "string" ? nodeUrl : nodeUrl[0],
    });

    const account = await createStarknetAccount(provider, ARGENT_X_CLASS_HASH);

    const sanitizedPubkey = encode.sanitizeHex(pubkey);
    const AXConstructorCallData = this.getConstructorCallData(sanitizedPubkey);

    return await account.getDeployAccountPayloadToSign(
      {
        classHash: ARGENT_X_CLASS_HASH,
        addressSalt: sanitizedPubkey,
        constructorCalldata: AXConstructorCallData,
        contractAddress: ArgentX.generateAddress(sanitizedPubkey),
      },
      { version: "0x3" } // version 3
    );
  };

  static estimateDeployFees = async (chainId: ChainId, pubkey: string): Promise<bigint> => {
    const nodeUrl = getProviderUrls(chainId, ProviderType.node);
    if (!nodeUrl) {
      throw new ThirdPartyProviderError("No node URL found for Starknet");
    }
    // TODO: Add support for multiple node URLs
    const provider = new StarknetProvider({
      nodeUrl: typeof nodeUrl === "string" ? nodeUrl : nodeUrl[0],
    });

    const sanitizedPubkey = encode.sanitizeHex(pubkey);

    const account = await createStarknetAccount(provider, ARGENT_X_CLASS_HASH);

    const AXConstructorCallData = this.getConstructorCallData(sanitizedPubkey);

    const fees = await account.estimateAccountDeployFee({
      classHash: ARGENT_X_CLASS_HASH,
      addressSalt: sanitizedPubkey,
      constructorCalldata: AXConstructorCallData,
      contractAddress: ArgentX.generateAddress(sanitizedPubkey),
    });

    const marginedFees = marginFees(fees.suggestedMaxFee);

    return marginedFees;
  };
}

export { ArgentX };
