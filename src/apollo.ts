import type {
  Apollo,
  DefaultOptions,
  DefaultRawBody,
  FetcherOptions,
  MaybePromise,
  MinFetchFn,
} from "./types";
import { fallbackOptions } from "./utils/fallback-options";
import { mergeEventHandlers } from "./utils/merge-event-handlers";

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


