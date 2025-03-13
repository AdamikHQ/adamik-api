import { ProviderType } from "~/app/model/types_WIP";
import { ThirdPartyProviderError } from "~/app/tools/handlers/errors";
import { paginationToB64 } from "~/app/tools/pagination";
import { fetchAccountTokensData as fetchAccountTokensDataFromOklink } from "../backend/oklink";
import { fetchAccountTokensData as fetchAccountTokensDataFromTronscan } from "../backend/tronscan";
import { TronService } from "../service";
import { getAccountTokens } from "./getAccountTokens";

jest.mock("@t3-oss/env-nextjs", () => ({
  createEnv: () => ({
    env: {
      MOESIF_APPLICATION_ID: "test",
      TEST_ENV: "test",
      REDIS_URL: "test",
    },
  }),
}));
jest.mock("../backend/tronscan");
jest.mock("../backend/oklink");

describe("getAccountTokens", () => {
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

  it("should fetch tokens from specified provider when pagination token is provided", async () => {
    const paginationToken = paginationToB64({ type: ProviderType.oklink, page: 2 }) as string;
    const mockResponse = {
      data: [{ tokenId: "2", balance: "200" }],
      nextPage: null,
    };

    (fetchAccountTokensDataFromOklink as jest.Mock).mockResolvedValueOnce(mockResponse);

    const result = await getAccountTokens.call(mockTronService, mockAccountId, paginationToken);

    expect(fetchAccountTokensDataFromOklink).toHaveBeenCalledWith(mockAccountId, paginationToken);
    expect(fetchAccountTokensDataFromTronscan).toHaveBeenCalledTimes(0);
    expect(result).toEqual(mockResponse);
  });

  it("should fallback to Oklink when Tronscan fails", async () => {
    const mockResponse = {
      data: [{ tokenId: "3", balance: "300" }],
      nextPage: null,
    };

    (fetchAccountTokensDataFromTronscan as jest.Mock).mockRejectedValueOnce(new Error("Tronscan failed"));
    (fetchAccountTokensDataFromOklink as jest.Mock).mockResolvedValueOnce(mockResponse);

    const result = await getAccountTokens.call(mockTronService, mockAccountId);

    expect(fetchAccountTokensDataFromTronscan).toHaveBeenCalled();
    expect(fetchAccountTokensDataFromOklink).toHaveBeenCalled();
    expect(result).toEqual(mockResponse);
  });

  it("should throw ThirdPartyProviderError when all providers fail", async () => {
    (fetchAccountTokensDataFromTronscan as jest.Mock).mockRejectedValueOnce(new Error("Tronscan failed"));
    (fetchAccountTokensDataFromOklink as jest.Mock).mockRejectedValueOnce(new Error("Oklink failed"));

    await expect(getAccountTokens.call(mockTronService, mockAccountId)).rejects.toThrow(
      ThirdPartyProviderError
    );
  });

  it("should throw ThirdPartyProviderError when provider failover is detected during pagination", async () => {
    const paginationToken = paginationToB64({ type: ProviderType.tronscan, page: 2 }) ?? undefined;

    (fetchAccountTokensDataFromTronscan as jest.Mock).mockRejectedValueOnce(new Error("Tronscan failed"));

    await expect(getAccountTokens.call(mockTronService, mockAccountId, paginationToken)).rejects.toThrow(
      ThirdPartyProviderError
    );
  });
});
