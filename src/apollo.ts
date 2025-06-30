import type {
  Apollo,
  DefaultOptions,
  DefaultRawBody,
  FetcherOptions,
  MaybePromise,
  MinFetchFn,
} from "./types";
import type { HeadersObject } from "./types/HeadersObject";
import {
  fallbackOptions,
  mergeEventHandlers,
  mergeOptions,
  isJsonifiable,
} from "./utils";

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
    const defaultOptions = await getDefaultOptions(input, fetchOpts, ctx);
    // 1. Merge all base properties first (including fallbackOptions, defaultOptions, fetchOpts)
    const mergedOptions = mergeOptions(
      fallbackOptions,
      defaultOptions,
      fetchOpts,
      emptyOptions
    );

    // 2. Then handle the special merging logic of event handlers on the merged result
    const finalOptions = mergeEventHandlers(
      mergedOptions,
      fetchOpts
    ) as TDefaultOptions;

    // 3. Serialize the request body (only when there is actual body content)
    const currentBody = (finalOptions as any).body;
    let wasBodySerialized = false;
    
    if (
      currentBody !== undefined &&
      currentBody !== null &&
      isJsonifiable(currentBody)
    ) {
      (finalOptions as any).body = finalOptions.serializeBody?.(currentBody);
      wasBodySerialized = true;
    }

    // 4. Handle headers - add Content-Type if body was serialized
    const currentHeaders = mergeHeaders([
      wasBodySerialized ? { "Content-Type": "application/json" } : {},
      finalOptions.headers,
    ]);


    finalOptions.headers = currentHeaders;

    return finalOptions;
  };
};

const mergeHeaders = (
  headerInits: (HeadersInit | HeadersObject | undefined)[]
) => {
  const res: Record<string, string> = {};
  headerInits.forEach((init) => {
    // casting `init` to `HeadersInit` because `Record<string, any>` is
    // properly transformed to `Record<string,string>` by `new Headers(init)`
    new Headers(init as HeadersInit | undefined).forEach((value, key) => {
      value === "null" || value === "undefined"
        ? delete res[key]
        : (res[key] = value);
    });
  });
  return res;
};
