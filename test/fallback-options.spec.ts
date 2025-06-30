import { describe, expect, it } from "vitest";
import { fallbackOptions, ResponseError } from "../src/utils";

describe("serializeParams", () => {
  it.each`
    params                                                                         | output
    ${{ key1: true, key2: false }}                                                 | ${"key1=true&key2=false"}
    ${{ key1: "123", key2: 1, key3: undefined, key4: null }}                       | ${"key1=123&key2=1&key4=null"}
    ${{ key1: "", key2: 0, key3: new Date("2024-06-09T12:34:56.789Z") }}           | ${"key1=&key2=0&key3=%222024-06-09T12%3A34%3A56.789Z%22"}
    ${{ key1: "", key2: 0, key3: new Date() }}                                     | ${`key1=&key2=0&key3=${encodeURIComponent(JSON.stringify(new Date()))}`}
    ${{ key1: { value: "123" } }}                                                  | ${"key1=%7B%22value%22%3A%22123%22%7D"}
    ${{ key1: ["123", null, undefined, 1, new Date("2024-06-09T12:34:56.789Z")] }} | ${"key1=%5B%22123%22%2Cnull%2Cnull%2C1%2C%222024-06-09T12%3A34%3A56.789Z%22%5D"}
    ${{ key1: [[1, "123", null, false, undefined]] }}                              | ${"key1=%5B%5B1%2C%22123%22%2Cnull%2Cfalse%2Cnull%5D%5D"}
    ${{ key1: [1, [2, false, null]] }}                                             | ${"key1=%5B1%2C%5B2%2Cfalse%2Cnull%5D%5D"}
    ${{ key1: { a: 1 } }}                                                          | ${"key1=%7B%22a%22%3A1%7D"}
  `("test case serializeParams %#", ({ params, output }) => {
    expect(fallbackOptions.serializeParams(params)).toBe(output);
  });
});

describe("serializeBody", () => {
  it("test case serializeBody", () => {
    expect(fallbackOptions.serializeBody({ key1: true, key2: false })).toBe(
      '{"key1":true,"key2":false}'
    );
    expect(
      fallbackOptions.serializeBody({
        key1: "123",
        key2: 1,
        key3: undefined,
        key4: null,
      })
    ).toBe('{"key1":"123","key2":1,"key4":null}');
  });
});

describe("parseResponse", () => {
  it.each`
    response                          | output
    ${new Response(null)}             | ${null}
    ${new Response()}                 | ${null}
    ${new Response(`{"name": "join", "age": 18, "status": true}`, {
  headers: {
    "content-type": "application/json; charset=utf-8",
  },
})} | ${{ name: "join", age: 18, status: true }}
    ${new Response("")}               | ${null}
    ${new Response(`<h1>hello</h1>`)} | ${"<h1>hello</h1>"}
  `("test case parseResponse %#", async ({ response, output }) => {
    expect(
      await fallbackOptions.parseResponse(response, {} as any)
    ).toStrictEqual(output);
  });
});

describe("parseRejected", () => {
  it.each`
    response              | output
    ${new Response(null)} | ${null}
    ${new Response()}     | ${null}
    ${new Response('')}   | ${null}
    ${new Response(`{"name": "join", "age": 18, "status": true}`, {
  headers: {
    "Content-type": "application/json; charset=utf-8",
  },
})} | ${{ name: "join", age: 18, status: true }}
  `("test case parseRejected %#", async ({ response, output }) => {
    const request = new Request("https://www.robots.com");
    const responseError: ResponseError = await fallbackOptions.parseRejected(
      response,
      request
    );
    expect(responseError instanceof ResponseError).toBeTruthy();
    expect(responseError.data).toStrictEqual(output);
    expect(responseError.request).toStrictEqual(request);
    expect(responseError.response).toStrictEqual(response);
    expect(responseError.name).toBe("ResponseError");
    expect(responseError.status).toBe(200);
    expect(responseError.message.startsWith("[200]")).toBeTruthy();
  });
});
