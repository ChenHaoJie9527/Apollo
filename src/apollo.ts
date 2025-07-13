import type {
  Apollo,
  DefaultOptions,
  DefaultRawBody,
  FetcherOptions,
  MaybePromise,
  MinFetchFn,
} from "./types";
import type { DistributiveOmit } from "./types/DistributiveOmit";
import type { RetryContext } from "./types/RetryOptions";
import {
  fallbackOptions,
  mergeEventHandlers,
  mergeOptions,
  isJsonifiable,
  mergeHeaders,
  withTimeout,
  toStreamable,
  abortableDelay,
  validate,
  executeWithRetry,
} from "./utils";
import { createRequest, executeRequest, getRetryConfigValue } from "./helps";

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


    let request: Request;
    const outcome = await executeWithRetry(
      input,
      finalOptions,
      defaultOptions,
      fetchOpts,
      ctx,
      _fetch
    );

    // 从 outcome 中提取 request 对象
    request = outcome.request;

    // Handle the final result
    if (outcome.error) {
      finalOptions.onError?.(outcome.error, request);
      throw outcome.error;
    }

    const response = outcome.response as Response;

    // Check if the response is rejected
    if (!(await (finalOptions.reject || (() => false))(response))) {
      // Success path: parse the response data
      let parsed: any;
      try {
        parsed = finalOptions.parseResponse
          ? await finalOptions.parseResponse(response, request)
          : await response.json();
      } catch (error: any) {
        finalOptions.onError?.(error, request);
        throw error;
      }

      // Schema validation (if a schema is provided)
      let data: any;
      try {
        // Skip schema validation for now, it will be added in the future
        data = finalOptions.schema
          ? await validate(finalOptions.schema, parsed)
          : parsed;
      } catch (error: any) {
        finalOptions.onError?.(error, request);
        throw error;
      }

      finalOptions.onSuccess?.(data, request);
      return data;
    }

    // Failure path: handle the rejected response
    let respError: any;
    try {
      respError = finalOptions.parseRejected
        ? await finalOptions.parseRejected(response, request)
        : new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error: any) {
      finalOptions.onError?.(error, request);
      throw error;
    }

    finalOptions.onError?.(respError, request);
    throw respError;
  };
};
