import { amountToMainUnit, amountToSmallestUnit } from "./amount";

describe("Amount utils", () => {
  describe("amountToMainUnit", () => {
    it("should convert zero correctly", () => {
      expect(amountToMainUnit("0", 18)).toBe("0");
    });

    it("should convert whole numbers correctly", () => {
      expect(amountToMainUnit("1000000000000000000", 18)).toBe("1");
      expect(amountToMainUnit("2000000000000000000", 18)).toBe("2");
    });

    it("should convert decimal numbers correctly", () => {
      expect(amountToMainUnit("500000000000000000", 18)).toBe("0.5");
      expect(amountToMainUnit("100000000000000", 18)).toBe("0.0001");
    });

    it("should handle different decimal places", () => {
      expect(amountToMainUnit("1000", 3)).toBe("1");
      expect(amountToMainUnit("100", 2)).toBe("1");
    });

    it("should return null for invalid inputs", () => {
      expect(amountToMainUnit("invalid", 18)).toBeNull();
      expect(amountToMainUnit("abc", 18)).toBeNull();
    });

    it("should handle null and undefined inputs", () => {
      expect(amountToMainUnit(null as any, 18)).toBeNull();
      expect(amountToMainUnit(undefined as any, 18)).toBeNull();
      expect(amountToMainUnit("1000", null as any)).toBeNull();
      expect(amountToMainUnit("1000", undefined as any)).toBeNull();
    });
  });

  describe("amountToSmallestUnit", () => {
    it("should convert zero correctly", () => {
      expect(amountToSmallestUnit("0", 18)).toBe("0");
    });

    it("should convert whole numbers correctly", () => {
      expect(amountToSmallestUnit("1", 18)).toBe("1000000000000000000");
      expect(amountToSmallestUnit("2", 18)).toBe("2000000000000000000");
    });

    it("should convert decimal numbers correctly", () => {
      expect(amountToSmallestUnit("0.5", 18)).toBe("500000000000000000");
      expect(amountToSmallestUnit("0.0001", 18)).toBe("100000000000000");
    });

    it("should handle different decimal places", () => {
      expect(amountToSmallestUnit("1", 3)).toBe("1000");
      expect(amountToSmallestUnit("1", 2)).toBe("100");
    });

    it("should handle null and undefined inputs", () => {
      expect(amountToSmallestUnit(null as any, 18)).toBeNull();
      expect(amountToSmallestUnit(undefined as any, 18)).toBeNull();
      expect(amountToSmallestUnit("1", null as any)).toBeNull();
      expect(amountToSmallestUnit("1", undefined as any)).toBeNull();
    });

    it("should handle invalid decimal inputs", () => {
      expect(amountToSmallestUnit("1.abc", 18)).toBeNull();
      expect(amountToSmallestUnit("invalid", 18)).toBeNull();
    });
  });
});
