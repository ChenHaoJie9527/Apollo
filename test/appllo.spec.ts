import { describe, expect, it, vi } from "vitest";
import { apollo } from "../src/apollo";
import type { DefaultOptions, FetcherOptions, MinFetchFn } from "../src/types";

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
    console.log("result====", result);

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

  // // 测试 getDefaultOptions 返回 Promise 的情况
  // it("should support async getDefaultOptions", async () => {
  // 	const fetch: MinFetchFn = (_url: string) => Promise.resolve(Response.json({}));
  // 	const getDefaultOptions = vi.fn().mockResolvedValue({ bar: 456 });
  // 	const api = apollo(fetch, getDefaultOptions);
  // 	const result = await api("/test", { method: "POST" } as any);
  // 	expect(getDefaultOptions).toHaveBeenCalled();
  // 	expect(result).toEqual({ bar: 456 });
  // });

  // // 测试参数是否正确传递到 getDefaultOptions
  // it("should pass input, fetchOpts, ctx to getDefaultOptions", async () => {
  // 	const fetch: MinFetchFn = (_url: string) => Promise.resolve(Response.json({}));
  // 	const getDefaultOptions = vi.fn().mockReturnValue({});
  // 	const api = apollo(fetch, getDefaultOptions);
  // 	const input = "/api";
  // 	const fetchOpts = { method: "PUT" } as any;
  // 	const ctx = { user: "test" };
  // 	await api(input, fetchOpts, ctx);
  // 	expect(getDefaultOptions).toHaveBeenCalledWith(input, fetchOpts, ctx);
  // });
});
