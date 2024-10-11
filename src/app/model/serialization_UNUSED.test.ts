import { stringToBigint, bigintToString } from "./serialization";

const f = () => false;
const dataset1: { input: unknown; output: unknown }[] = [
  {
    input: {
      a: 1,
      b: "2",
      c: "bleh",
      d: {
        e: 0,
        f,
      },
      g: [1, "2", "three"],
      h: null,
      i: undefined,
      j: {},
    },
    output: {
      a: 1,
      b: 2n,
      c: "bleh",
      d: {
        e: 0,
        f,
      },
      g: [1, 2n, "three"],
      h: null,
      i: undefined,
      j: {},
    },
  },
  {
    input: 1234,
    output: 1234,
  },
  {
    input: 999999999999999999999999999999999999999999,
    output: 999999999999999999999999999999999999999999,
  },
  {
    input: "1234",
    output: 1234n,
  },
  {
    input: "0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B",
    output: "0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B",
  },
  {
    input: "some string",
    output: "some string",
  },
  {
    input: null,
    output: null,
  },
  {
    input: undefined,
    output: undefined,
  },
  {
    input: true,
    output: true,
  },
  {
    input: [1, 2, 3],
    output: [1, 2, 3],
  },
  {
    input: f,
    output: f,
  },
];

const dataset2 = {
  input: {
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
                        k: "boom",
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
  },
  output: new Error("Max recursion nb reached"),
};

describe("serialization", () => {
  describe("stringsToNumbers", () => {
    test("all types", () => {
      for (const data of dataset1) {
        const result = stringToBigint(data.input);
        expect(result).toStrictEqual(data.output);
      }
    });

    test("too many recursions", () => {
      expect(() => stringToBigint(dataset2.input)).toThrow(dataset2.output);
    });
  });

  describe("numbersToString", () => {
    test("all types", () => {
      for (const data of dataset1) {
        const result = bigintToString(data.output);
        expect(result).toStrictEqual(data.input);
      }
    });

    test("too many recursions", () => {
      expect(() => bigintToString(dataset2.input)).toThrow(dataset2.output);
    });
  });
});
