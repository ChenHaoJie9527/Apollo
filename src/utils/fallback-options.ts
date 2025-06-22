import type { FallbackOptions } from "../types";
import { ResponseError } from "./response-error";

export const fallbackOptions: FallbackOptions = {
  parseResponse: (response) => {
    return response
      .clone()
      .json()
      .catch(() => response.text())
      .then((data) => data || null);
  },
  parseRejected: async (response, request) => {
    return new ResponseError(
      response,
      await parseResponseData(response, request),
      request
    );
  },
  serializeParams: (params) => {
    const stringified = Object.fromEntries(
      Object.entries(params).map(([key, value]) => {
        return [key, typeof value === "string" ? value : JSON.stringify(value)];
      })
    );
    return new URLSearchParams(stringified).toString();
  },
  //   serializeBody: (body: any) => {

  //   },
  reject: (response) => {
    return !response.ok;
  },
  retry: {
    when: (ctx) => ctx.response?.ok === false,
    attempts: 0,
    delay: 0,
  },
};

async function parseResponseData(response: Response, request: Request) {
  return fallbackOptions.parseResponse(response, request);
}
