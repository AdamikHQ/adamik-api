import { deepBigintToString } from "./bigint";

// Tests
describe("deepBigintToString", () => {
  it("should convert an object with bigints to strings", () => {
    const obj = {
      a: 1n,
      b: {
        c: 2n,
        d: [3n, 4n],
      },
    };
    const expected = {
      a: "1",
      b: {
        c: "2",
        d: ["3", "4"],
      },
    };
    const result = deepBigintToString(obj);
    expect(result).toEqual(expected);
  });

  it("should handle arbitrary nesting", () => {
    const obj = {
      a: {
        b: {
          c: {
            d: {
              e: {
                f: {
                  g: {
                    h: {
                      i: {
                        j: {
                          k: 1n,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    };
    const expected = {
      a: {
        b: {
          c: {
            d: {
              e: {
                f: {
                  g: {
                    h: {
                      i: {
                        j: {
                          k: "1",
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    };
    expect(deepBigintToString(obj)).toEqual(expected);
  });

  it("should handle null and undefined", () => {
    const obj = {
      a: null,
      b: undefined,
    };
    const expected = {
      a: null,
      b: undefined,
    };
    expect(deepBigintToString(obj)).toEqual(expected);
  });

  it("should handle non bigint values", () => {
    const obj = {
      a: 1,
      b: "hello",
    };
    const expected = {
      a: 1,
      b: "hello",
    };
    expect(deepBigintToString(obj)).toEqual(expected);
  });

  it("should handle arrays", () => {
    const obj = {
      a: [1n, 2n],
      b: [[3n, 4n]],
    };
    const expected = {
      a: ["1", "2"],
      b: [["3", "4"]],
    };
    expect(deepBigintToString(obj)).toEqual(expected);
  });

  it("should handle objects with nested arrays", () => {
    const obj = {
      a: {
        b: [1n, [2n, 3n]],
      },
    };
    const expected = {
      a: {
        b: ["1", ["2", "3"]],
      },
    };
    expect(deepBigintToString(obj)).toEqual(expected);
  });
});
