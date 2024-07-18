import { NextResponse } from "next/server";
import { getService } from "~/app/families/services";
import { ApiRequestFilters } from "~/app/model/types_WIP";
import { deepBigintOrNumToString } from "~/app/tools/convertors/deepBigintToString";
import { apiHandlerWrapper } from "~/app/tools/handlers/apiHandler";
import { requestSchema, responseSchema } from "./schema";

export const POST = apiHandlerWrapper(
  async ({ chainId, accountId }) => {
    // Parse supported query params like : /.../...?include=native,tokens,staking
    // to build an ApiRequestFilters object like : { native?: true, tokens?: true, staking?: true }
    const filters: ApiRequestFilters = {};
    // FIXME: add request access to apiHandler
    const params = request.nextUrl.searchParams;
    params
      .get("include")
      ?.split(",")
      .filter(Boolean)
      .forEach((param) => {
        filters[param] = true;
      });

    const service = getService(chainId);

    const isAccountIdValid = await service.validateAddress(accountId);

    if (!isAccountIdValid) {
      return NextResponse.json(
        { message: `Invalid accountId ${accountId} for chainId ${chainId}` },
        { status: 400, statusText: "Invalid or missing fields" }
      );
    }

    try {
      const state = await service.getAccountState(accountId);

      // Apply filters
      // Each field is returned if (explicitely demanded OR nothing specific demanded)
      const includeNative = filters.native || !Object.keys(filters).length;
      const includeTokens = filters.tokens || !Object.keys(filters).length;
      const includeStaking = filters.staking || !Object.keys(filters).length;
      state.balances = {
        // Syntax trick to conditionally include fields
        ...(includeNative && { native: state.balances.native }),
        ...(includeTokens && { tokens: state.balances.tokens }),
        ...(includeStaking && { staking: state.balances.staking }),
      };
      return NextResponse.json(deepBigintOrNumToString(state));
    } catch (e: any) {
      // FIXME Weak error management...
      // We should maybe propagate a status instead, same as for transaction/encode
      return NextResponse.json(
        { message: e.toString() },
        { status: 400, statusText: "Invalid or missing fields" }
      );
    }
  },
  {
    requestSchema,
    responseSchema,
  }
);
