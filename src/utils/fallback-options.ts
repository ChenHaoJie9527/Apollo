import type { FallbackOptions } from "../types";

export const fallbackOptions: FallbackOptions = {
  parseResponse: (response) => {
    return response
      .clone()
      .json()
      .catch(() => response.text())
      .then((data) => data || null);
  },
  parseRejected: async (res, request) => {

  },
  serializeParams: (params) => {

  },
  serializeBody: (body: any) => {

  },
  reject: (response) => {
    return !response.ok;
  },
  retry: {
    when: (ctx) => ctx.response?.ok === false,
    attempts: 0,
    delay: 0,
  },
};
