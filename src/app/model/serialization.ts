const MAX_RECURSION = 10;

/**
 *
 * @param input TODO Description
 * @param level
 * @returns
 */
function stringToBigint(input: unknown, level: number = 0) {
  if (level === MAX_RECURSION) {
    throw new Error("Max recursion nb reached");
  }

  if (!input || ["boolean", "function", "symbol", "bigint", "number"].includes(typeof input)) {
    return input;
  }

  if (["string"].includes(typeof input)) {
    try {
      // @ts-ignore: mismatch between "object" and {}
      const output = BigInt(input);
      return output;
    } catch {
      return input;
    }
  }

  let output: any;
  if (Array.isArray(input)) {
    output = [];
  } else {
    output = {};
  }

  for (const entry of Object.entries(input)) {
    output[entry[0]] = stringToBigint(entry[1], level + 1);
  }

  return output;
}

/**
 *
 * @param input TODO Description
 * @param level
 * @returns
 */
function bigintToString(input: unknown, level: number = 0): unknown {
  if (level === MAX_RECURSION) {
    throw new Error("Max recursion nb reached");
  }

  if (!input || ["boolean", "function", "symbol", "string", "number"].includes(typeof input)) {
    return input;
  }

  if (["bigint"].includes(typeof input)) {
    try {
      return `${input}`;
    } catch {
      return input;
    }
  }

  let output: any;
  if (Array.isArray(input)) {
    output = [];
  } else {
    output = {};
  }

  for (const entry of Object.entries(input)) {
    output[entry[0]] = bigintToString(entry[1], level + 1);
  }

  return output;
}

export { stringToBigint, bigintToString };
