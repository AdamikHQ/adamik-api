// Because Object.entries() changes the type of the object to {[key: string]: any},
// we need to use this type to convert it back to the original type but with strings instead of bigints
export type DeeplyConvertedBigInt<T> = T extends (infer U)[]
  ? DeeplyConvertedBigInt<U>[]
  : T extends object
  ? { [K in keyof T]: DeeplyConvertedBigInt<T[K]> }
  : T extends bigint
  ? string
  : T;

/**
 * Converts all bigints in an object to strings while keeping the object structure at compile time
 * @param obj - Object to recursively convert all bigints fields to strings
 * @returns DeeplyConvertedBigInt version of the object
 */
export function deepBigintToString<T>(data: T): DeeplyConvertedBigInt<T> {
  if (data === null || data === undefined) {
    return data as DeeplyConvertedBigInt<T>;
  }

  if (Array.isArray(data)) {
    return data.map((item) => deepBigintToString(item)) as DeeplyConvertedBigInt<T>;
  }

  if (typeof data === "object") {
    return Object.fromEntries(
      Object.entries(data).map(([key, value]) => {
        return [key, deepBigintToString(value)];
      })
    ) as DeeplyConvertedBigInt<T>;
  }

  if (typeof data === "bigint") {
    return data.toString() as DeeplyConvertedBigInt<T>;
  }

  return data as DeeplyConvertedBigInt<T>;
}
