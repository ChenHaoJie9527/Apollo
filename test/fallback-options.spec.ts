import { describe, expect, test } from "vitest";
import { fallbackOptions } from "../src/utils/fallback-options";
// import { ResponseError } from "../src/utils/response-error";

describe("serializeParams", () => {
  test.each`
    params                         | output
    ${{ key1: true, key2: false }} | ${"key1=true&key2=false"}
    ${{key1: '123', key2: 1, key3: undefined, key4: null}} | ${'key1=123&key2=1&key4=null'}
    ${{key1: '', key2: 0, key3: new Date("2024-06-09T12:34:56.789Z")}} | ${'key1=&key2=0&key3=%222024-06-09T12%3A34%3A56.789Z%22'}
  `("test case serializeParams %#", ({ params, output }) => {
    expect(fallbackOptions.serializeParams(params)).toBe(output);
  });
});
