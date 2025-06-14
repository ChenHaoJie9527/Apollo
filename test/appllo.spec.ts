import { describe, it, expect } from "vitest";
import { apollo } from "../src/apollo";
import { MinFetchFn } from "../src/types";

describe("apollo", () => {
  // 判断apollo函数是否存在
  it("should be defined", () => {
    expect(apollo).toBeDefined();
  });

  // 判断apollo函数的第一个入参是否符合泛型T
  it("should accept a fetch function matching MinFetchFn", () => {
    const fetch: MinFetchFn = (url: string) =>
      Promise.resolve(Response.json({}));
    const api = apollo(fetch, () => {});
    expect(api).toBeDefined();
  });
});
