import { describe, expect, test, it } from "vitest";
import { apollo } from "../src/apollo";
import type { DefaultOptions, MinFetchFn } from "../src/types";

describe("apollo", () => {
  // 判断apollo函数是否存在
  it("should be defined", () => {
    expect(apollo).toBeDefined();
  });

  // 判断apollo函数的第一个入参是否符合泛型T
  it("should accept a fetch function matching MinFetchFn", () => {
    const fetch: MinFetchFn = (_url: string) =>
      Promise.resolve(Response.json({}));
    const api = apollo(fetch, () => ({}));
    expect(api).toBeDefined();
  });

  // 测试 getDefaultOptions 是否被调用，返回值是否正确
  it("should call getDefaultOptions and return its result", async () => {
    const myFetch: MinFetchFn = async (
      input,
      fetchOpts,
      ctx
    ): Promise<Response> => {
      console.log("Fetch called with:", { input, fetchOpts, ctx });
      return Response.json({});
    };

    const getDefaultOptions = (
      input,
      fetchOpts,
      ctx
    ): DefaultOptions<typeof fetch, any, any> => {
      return {
        baseUrl: "https://api.example.com",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer 1234567890",
        },
        method: "GET",
        params: {
          name: "John",
          age: 30,
        },
        credentials: "include",
        parseResponse: async (response) => {
          const data = await response.json();
          return data;
        },
        serializeBody: (body) => {
          return JSON.stringify(body);
        },
      };
    };

    const api = apollo(myFetch, getDefaultOptions);
    const result = await api(
      "/users",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
      {
        auth: "1234567890",
      }
    );

    expect(result).toEqual({
      baseUrl: "https://api.example.com",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer 1234567890",
      },
      method: "GET",
      params: {
        name: "John",
        age: 30,
      },
      credentials: "include",
      parseResponse: expect.any(Function),
      serializeBody: expect.any(Function),
    });
  });
});

describe("Should receive the apollo arguments (up to 3)", () => {
  const baseUrl = "https://example.com";
  test.each`
    expectedInput       | expectedOptions         | expectedCtx
    ${baseUrl}          | ${{ method: "DELETE" }} | ${{ is: "ctx" }}
    ${new URL(baseUrl)} | ${{ method: "DELETE" }} | ${"context"}
    ${baseUrl}          | ${{ method: "POST" }} | ${{ name: "John", age: 30 }}
  `("test case %#", async ({ expectedInput, expectedOptions, expectedCtx }) => {

    const fetch: MinFetchFn = async (input, fetchOpts, ctx) => {
      expect(input).toBe(expectedInput);
      expect(fetchOpts).toEqual(expectedOptions);
      expect(ctx).toEqual(expectedCtx);
      return Response.json({});
    };

    const defaultOptions = (input, fetchOpts, ctx) => {
      return {
        baseUrl: expectedInput || expectedInput.href,
        method: expectedOptions.method,
        headers: {
          "Content-Type": "application/json",
        },
        params: expectedOptions.params,
        credentials: expectedOptions.credentials,
        parseResponse: expectedOptions.parseResponse,
        accessToken: "123",
        body: expectedCtx,
      }
    }

    const api = apollo(fetch, defaultOptions)
    const result = await api(expectedInput, expectedOptions, expectedCtx)

    expect(result).toEqual({
      baseUrl: expectedInput,
      method: expectedOptions.method,
      headers: {
        "Content-Type": "application/json",
      },
      params: undefined,
      credentials: undefined,
      parseResponse: undefined,
      accessToken: "123",
      body: expectedCtx,
    }); 
  });
});
