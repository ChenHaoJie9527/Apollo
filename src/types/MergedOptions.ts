import type { DefaultOptions } from "./DefaultOptions";
import type { FetcherOptions } from "./FetcherOptions";
import type { HeadersObject } from "./HeadersObject";
import type { MaybePromise } from "./MaybePromise";
import type { MinFetchFn } from "./MinFetchFn";

/**
 * The final option type after merging, representing the configuration after mergeOptions processing
 * This is the intersection of DefaultOptions and FetcherOptions, containing runtime-added properties
 */
export type MergedOptions = DefaultOptions<MinFetchFn, any, any> &
  Partial<FetcherOptions<MinFetchFn, any, any, any>> & {
    // Runtime-added properties
    signal?: AbortSignal;
    headers?: HeadersInit | HeadersObject;
    reject?: (response: Response) => MaybePromise<boolean>;
    [key: string]: any;
  };
