/**
 * Converts an amount from the smallest unit to the main unit
 * @param amount - The amount in the smallest unit
 * @param decimals - The number of decimals in the smallest unit
 * @returns The amount in the main unit or null if invalid amount
 * Example: 1000000000000000000 -> 1
 */
export const amountToMainUnit = (amount: string, decimals: number): string | null => {
  if (decimals === null || decimals === undefined || amount === null || amount === undefined) {
    return null;
  }
  const parsedAmount = amount === "0" ? 0 : Number(amount);
  return Number.isNaN(parsedAmount) ? null : (parsedAmount / Math.pow(10, decimals)).toString();
};

/**
 * Converts an amount from the main unit to the smallest unit
 * @param amount - The amount in the main unit
 * @param decimals - The number of decimals in the smallest unit
 * @returns The amount in the smallest unit or null if invalid amount
 * Example: 1 -> 1000000000000000000
 */
export const amountToSmallestUnit = (amount: string, decimals: number): string | null => {
  if (decimals === null || decimals === undefined || amount === null || amount === undefined) {
    return null;
  }
  const computedAmount = Number(amount) * Math.pow(10, decimals);
  if (Number.isNaN(computedAmount)) {
    return null;
  }
  return Math.trunc(computedAmount).toString();
};
