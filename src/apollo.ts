import type { MinFetchFn } from "./types";

const emptyOptions = {} as any;

export const apollo = <T extends MinFetchFn, K, M>(
  fetch: T,
  createOptionsFunction: (ctx: M) => K
) => {
  return {
    get: (url: string) => {
      return fetch(url);
    },
  };
};
