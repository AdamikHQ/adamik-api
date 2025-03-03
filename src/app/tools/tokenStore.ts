import { createClient } from "redis";
import { env } from "~/env";
import { ChainId, Token, TokenType } from "~/app/model/types_WIP";

function parseRedisToken(obj: { [x: string]: string }): Token | null {
  const keys = Object.keys(obj);

  if (
    !keys.includes("type") ||
    !keys.includes("id") ||
    !keys.includes("name") ||
    !keys.includes("ticker") ||
    !keys.includes("decimals")
  ) {
    return null;
  }

  if (!(Object.values(TokenType) as Array<string>).includes(obj.type)) {
    return null;
  }

  const decimals = Number(obj.decimals);

  if (isNaN(decimals)) {
    return null;
  }

  return {
    type: obj.type as TokenType,
    id: obj.id,
    name: obj.name,
    ticker: obj.ticker,
    decimals,
    contractAddress: obj.contractAddress,
    logo: obj.logo,
  };
}

export class TokenStore {
  static client = createClient({
    url: env.REDIS_URL,
  });
  static mapping: { [key in ChainId]?: Record<string, Token> } = {};

  static async connect(): Promise<void> {
    if (TokenStore.client.isOpen) {
      console.log("Redis is already open");
      return;
    }

    if (!TokenStore.client.isReady) {
      await TokenStore.client.connect();
      return;
    }

    throw new Error("Failed to connect to Redis");
  }

  static async save(chainId: ChainId, tokens: Array<Token | null>): Promise<void> {
    if (env.TEST_ENV === "true") {
      return;
    }
    await TokenStore.connect();
    await Promise.all(
      tokens.map(async (token) => {
        if (token === null) return;
        token = JSON.parse(JSON.stringify(token)) as Token;
        if (!TokenStore.mapping[chainId]) {
          TokenStore.mapping[chainId] = {};
        }
        TokenStore.mapping[chainId][token.id] = token;
        const key = `token:${chainId}:${token.id}`;
        await TokenStore.client.hSet(key, token).catch((e) => {
          console.error(e.message);
        });
      })
    );
  }

  static async load(chainId: ChainId, tokenIds: Array<string>): Promise<Array<Token | null>> {
    if (env.TEST_ENV === "true") {
      return tokenIds.map(() => null);
    }
    await TokenStore.connect();
    const tokens = await Promise.all(
      tokenIds.map(async (id) => {
        if (!TokenStore.mapping[chainId]) {
          TokenStore.mapping[chainId] = {};
        }
        if (TokenStore.mapping[chainId][id]) {
          return TokenStore.mapping[chainId][id];
        }
        const redisToken = await TokenStore.client.hGetAll(`token:${chainId}:${id}`);
        const token = parseRedisToken(redisToken);
        if (token !== null) {
          TokenStore.mapping[chainId][id] = token;
        }

        return token;
      })
    );
    await TokenStore.save(chainId, tokens);
    return tokens;
  }
}
