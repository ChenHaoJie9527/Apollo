import {
  describe,
  expect,
  it,
  vi,
  beforeEach,
  afterAll,
  afterEach,
  beforeAll,
} from "vitest";
import { apollo } from "../src/apollo";
import type { MinFetchFn } from "../src/types";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";

const server = setupServer();

describe("apollo", () => {
  // 基础函数定义测试
  it("should be defined", () => {
    expect(apollo).toBeDefined();
  });

  it("should accept a fetch function matching MinFetchFn", () => {
    const fetch: MinFetchFn = (_url: Request) =>
      Promise.resolve(Response.json({}));
    const api = apollo(fetch, () => ({}));
    expect(api).toBeDefined();
  });
});

describe("apollo http request with msw", () => {
  beforeAll(() => {
    server.listen({
      onUnhandledRequest: "error",
    });
  });
  afterEach(() => {
    server.resetHandlers();
  });

  afterAll(() => {
    server.close();
  });

  it.each`
    scenario             | method    | url                             | responseStatus | responseData                   | expectedResult
    ${"GET successful"}  | ${"GET"}  | ${"https://api.test.com/users"} | ${200}         | ${{ users: ["Alice", "Bob"] }} | ${{ users: ["Alice", "Bob"] }}
    ${"POST successful"} | ${"POST"} | ${"https://api.test.com/users"} | ${201}         | ${{ id: 1, name: "Alice" }}    | ${{ id: 1, name: "Alice" }}
  `(
    "should $scenario",
    async ({ method, url, responseStatus, responseData, expectedResult }) => {
      server.use(
        http[method.toLowerCase()](url, () => {
          return HttpResponse.json(responseData, { status: responseStatus });
        })
      );
      const api = apollo(fetch);
      const result = await api(url, {
        method,
      });
      expect(result).toEqual(expectedResult);
    }
  );
});
