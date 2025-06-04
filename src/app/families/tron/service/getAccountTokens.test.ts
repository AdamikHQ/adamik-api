import { ProviderType } from "~/app/model/types_WIP";
import { ThirdPartyProviderError } from "~/app/tools/handlers/errors";
import { paginationToB64 } from "~/app/tools/pagination";
import { fetchAccountTokensData as fetchAccountTokensDataFromTronscan } from "../backend/tronscan";
import { TronService } from "../service";
import { getAccountTokens } from "./getAccountTokens";

jest.mock("../backend/tronscan");

// Disable until we found an another provider, because failover wont work
describe.skip("getAccountTokens", () => {
  const mockTronService = {} as TronService;
  const mockAccountId = "TRxxxxxxxxxxxxxxxxxxxxxxxxxxx";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch tokens from Tronscan when no pagination token is provided", async () => {
    const mockResponse = {
      data: [{ tokenId: "1", balance: "100" }],
      nextPage: null,
    };

    (fetchAccountTokensDataFromTronscan as jest.Mock).mockResolvedValueOnce(mockResponse);

    const result = await getAccountTokens.call(mockTronService, mockAccountId);

    expect(fetchAccountTokensDataFromTronscan).toHaveBeenCalledWith(mockAccountId, undefined);
    expect(result).toBe(mockResponse);
  });

  it("should fetch tokens from Tronscan provider when pagination token is provided", async () => {
    const paginationToken = paginationToB64({ type: ProviderType.tronscan, page: 2 }) as string;
    const mockResponse = {
      data: [{ tokenId: "4", balance: "400" }],
      nextPage: null,
    };

    (fetchAccountTokensDataFromTronscan as jest.Mock).mockResolvedValueOnce(mockResponse);

    const result = await getAccountTokens.call(mockTronService, mockAccountId, paginationToken);

    expect(fetchAccountTokensDataFromTronscan).toHaveBeenCalledWith(mockAccountId, paginationToken);
    expect(result).toEqual(mockResponse);
  });

  // it("should fallback to Oklink when Tronscan fails", async () => {
  //   const mockResponse = {
  //     data: [{ tokenId: "3", balance: "300" }],
  //     nextPage: null,
  //   };

  //   (fetchAccountTokensDataFromTronscan as jest.Mock).mockRejectedValueOnce(new Error("Tronscan failed"));
  //   (fetchAccountTokensDataFromOklink as jest.Mock).mockResolvedValueOnce(mockResponse);

  //   const result = await getAccountTokens.call(mockTronService, mockAccountId);

  //   expect(fetchAccountTokensDataFromTronscan).toHaveBeenCalled();
  //   expect(fetchAccountTokensDataFromOklink).toHaveBeenCalled();
  //   expect(result).toEqual(mockResponse);
  // });

  // it("should throw ThirdPartyProviderError when all providers fail", async () => {
  //   (fetchAccountTokensDataFromTronscan as jest.Mock).mockRejectedValueOnce(new Error("Tronscan failed"));
  //   (fetchAccountTokensDataFromOklink as jest.Mock).mockRejectedValueOnce(new Error("Oklink failed"));

  //   jest.spyOn(console, "warn").mockImplementation(() => {});
  //   await expect(getAccountTokens.call(mockTronService, mockAccountId)).rejects.toThrow(
  //     ThirdPartyProviderError
  //   );
  // });

  it("should throw ThirdPartyProviderError when provider failover is detected during pagination", async () => {
    const paginationToken = paginationToB64({ type: ProviderType.tronscan, page: 2 }) as string;
    jest.spyOn(console, "warn").mockImplementation(() => {});

    (fetchAccountTokensDataFromTronscan as jest.Mock).mockRejectedValueOnce(new Error("Tronscan failed"));

    await expect(getAccountTokens.call(mockTronService, mockAccountId, paginationToken)).rejects.toThrow(
      ThirdPartyProviderError
    );
  });
});
