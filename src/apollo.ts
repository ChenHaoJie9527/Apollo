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
  createRequest
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

    // Retry counter: used to determine if the maximum number of retries has been exceeded
    let attempt = 0;
    // Request object reference: stores the Request object, used in retry logic and callback functions
    let request: Request;
    // Tracking retry results: stores retry results, possibly containing response or error
    const outcome = {} as DistributiveOmit<RetryContext, "request">;
    do {
      // per-try timeout
      // Retry counter: used to determine if the maximum number of retries has been exceeded
      finalOptions.signal = withTimeout(
        finalOptions.signal,
        finalOptions.timeout
      );

      request = await createRequest(input, finalOptions, defaultOptions, fetchOpts);

      finalOptions.onRequest?.(request);

      try {
        outcome.response = await toStreamable(
          await _fetch(
            request,
            // do not override the request body & patch headers again
            // body and headers are already set in the new request
            { ...finalOptions, body: undefined, headers: request.headers },
            ctx
          ),
          // Download progress callback function
          finalOptions.onResponseStreaming
        );
      } catch (e: any) {
        outcome.error = e;
      }

      // Get the retry configuration and make sure there are default values
      const retryConfig = finalOptions.retry || {
        attempts: 0,
        delay: 0,
        when: () => false,
      };

      // There are two conditions for deciding whether or not to exit the retry loop
      if (
        !(await retryConfig.when({ request, ...outcome })) ||
        ++attempt >
          (typeof retryConfig.attempts === "function"
            ? await retryConfig.attempts(request)
            : retryConfig.attempts)
      )
        break;

      await abortableDelay(
        typeof retryConfig.delay === "function"
          ? await retryConfig.delay({ attempt, request, ...outcome })
          : retryConfig.delay,
        finalOptions.signal
      );

      finalOptions.onRetry?.({ attempt, request, ...outcome });
      // biome-ignore lint/correctness/noConstantCondition: <explanation>
    } while (true);

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
