import type {
  Apollo,
  DefaultOptions,
  DefaultRawBody,
  FetcherOptions,
  MaybePromise,
  MinFetchFn,
} from "./types";
import { fallbackOptions } from "./utils/fallback-options";

const emptyOptions = {} as any;

export const apollo = <
  const TFetch extends MinFetchFn,
  const TDefaultOptions extends DefaultOptions<
    TFetch,
    any,
    any
  > = DefaultOptions<TFetch, any, DefaultRawBody>
>(
  _fetch: TFetch,
  getDefaultOptions: (
    input: Parameters<TFetch>[0],
    fetchOpts: FetcherOptions<TFetch, any, any, any>,
    ctx?: Parameters<TFetch>[2]
  ) => MaybePromise<TDefaultOptions> = () => emptyOptions
): Apollo<TFetch, TDefaultOptions> => {
  return async (input, fetchOpts, ctx) => {
    let defaultOptions = await getDefaultOptions(input, fetchOpts, ctx);

    const mergedOptions = mergeOptions(
      fallbackOptions,
      defaultOptions,
      fetchOpts,
      emptyOptions
    );

    defaultOptions = mergeEventHandlers(defaultOptions, fetchOpts) as TDefaultOptions;

    return defaultOptions;
  };
};

function mergeOptions<T1, T2, T3, T4>(opt1: T1, opt2: T2, opt3: T3, opt4: T4) {
  const merged = {
    ...opt1,
    ...opt2,
    ...opt3,
    ...opt4,
  };

  const retryOptions = {
    ...(opt1 as any)?.retry,
    ...(opt2 as any)?.retry,
    ...(opt3 as any)?.retry,
    ...(opt4 as any)?.retry,
  };

  if (Object.keys(retryOptions).length > 0) {
    (merged as any).retry = retryOptions;
  }

  return merged;
}

export function mergeEventHandlers<
  T extends Record<string, any>,
  U extends Record<string, any>
>(defaultOptions: T, fetchOpts: U) {
  let mergeOptions: Record<string, any> = { ...defaultOptions };
  Object.keys(defaultOptions).forEach((key) => {
    if (/^on[A-Z]/.test(key)) {
      const originalHandler = defaultOptions[key];
      const fetchHandler = fetchOpts[key];
      if (
        typeof originalHandler === "function" &&
        typeof fetchHandler === "function"
      ) {
        (mergeOptions as any)[key] = (...args: any[]) => {
          originalHandler(...args);
          fetchHandler(...args);
        };
      } else if (
        typeof fetchHandler === "function" &&
        typeof originalHandler !== "function"
      ) {
        (mergeOptions as any)[key] = fetchHandler;
      }
    }
  });

  Object.keys(fetchOpts).forEach((key) => {
    if (/^on[A-Z]/.test(key)) {
      const fetchHandler = fetchOpts[key];
      if (typeof fetchHandler === "function" && !defaultOptions[key]) {
        (mergeOptions as any)[key] = fetchHandler;
      }
    }
  });

  return mergeOptions;
}
