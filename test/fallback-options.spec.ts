import { describe, expect, test } from "vitest";
import { fallbackOptions } from "../src/utils/fallback-options";
// import { ResponseError } from "../src/utils/response-error";

describe("serializeParams", () => {
  test.each`
    params                                                                         | output
    ${{ key1: true, key2: false }}                                                 | ${"key1=true&key2=false"}
    ${{ key1: "123", key2: 1, key3: undefined, key4: null }}                       | ${"key1=123&key2=1&key4=null"}
    ${{ key1: "", key2: 0, key3: new Date("2024-06-09T12:34:56.789Z") }}           | ${"key1=&key2=0&key3=%222024-06-09T12%3A34%3A56.789Z%22"}
    ${{ key1: "", key2: 0, key3: new Date() }}                                     | ${`key1=&key2=0&key3=${encodeURIComponent(JSON.stringify(new Date()))}`}
    ${{ key1: { value: "123" } }}                                                  | ${"key1=%7B%22value%22%3A%22123%22%7D"}
    ${{ key1: ["123", null, undefined, 1, new Date("2024-06-09T12:34:56.789Z")] }} | ${"key1=%5B%22123%22%2Cnull%2Cnull%2C1%2C%222024-06-09T12%3A34%3A56.789Z%22%5D"}
    ${{ key1: [[1, "123", null, false, undefined]] }}                              | ${"key1=%5B%5B1%2C%22123%22%2Cnull%2Cfalse%2Cnull%5D%5D"}
    ${{ key1: [1, [2, false, null]] }}                                             | ${"key1=%5B1%2C%5B2%2Cfalse%2Cnull%5D%5D"}
  `("test case serializeParams %#", ({ params, output }) => {
    expect(fallbackOptions.serializeParams(params)).toBe(output);
  });
});
