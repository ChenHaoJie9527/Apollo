import type { MinFetchFn, DefaultOptions, DefaultRawBody } from "./types";


export const apollo = <
  const TFetch extends MinFetchFn,
  const TDefaultOptions extends DefaultOptions<
    TFetch,
    any,
    any
  > = DefaultOptions<TFetch, any, DefaultRawBody>
>(
  fetch: TFetch,
  createOptionsFunction: () => void
) => {
  return {
    get: (url: string) => {
      return fetch(url);
    },
  };
};
