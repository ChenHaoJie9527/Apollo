import type {
  Apollo,
  DefaultOptions,
  DefaultRawBody,
  FetcherOptions,
  MaybePromise,
  MinFetchFn,
  RequestContext,
} from "./types";
import {
  fallbackOptions,
  mergeEventHandlers,
  mergeOptions,
  isJsonifiable,
  mergeHeaders,
  RequestStateMachine,
} from "./utils";

const emptyOptions = {} as any;

/**
 * Apollo HTTP client with state machine pattern
 * This version uses a state machine to handle the complex request flow
 */
export const apolloStateMachine = <
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
    // 1. Options merging phase (same as original)
    const defaultOptions = await getDefaultOptions(input, fetchOpts, ctx);
    
    const mergedOptions = mergeOptions(
      fallbackOptions,
      defaultOptions,
      fetchOpts,
      emptyOptions
    );

    const finalOptions = mergeEventHandlers(
      mergedOptions,
      fetchOpts
    ) as TDefaultOptions;

    // 2. Body serialization phase (same as original)
    const currentBody = (finalOptions as any).body;
    // Whether the body was serialized
    let wasBodySerialized = false;

    if (
      currentBody !== undefined &&
      currentBody !== null &&
      isJsonifiable(currentBody)
    ) {
      (finalOptions as any).body = finalOptions.serializeBody?.(currentBody);
      wasBodySerialized = true;
    }

    // 3. Headers handling phase (same as original)
    const currentHeaders = mergeHeaders([
      wasBodySerialized ? { "Content-Type": "application/json" } : {},
      finalOptions.headers,
    ]);

    finalOptions.headers = currentHeaders;

    // 4. Create state machine context
    const context: RequestContext = {
      input,
      finalOptions,
      defaultOptions,
      fetchOpts,
      ctx,
      _fetch,
      attempt: 0,
      maxAttempts: 0,
    };

    // 5. Execute state machine
    const stateMachine = new RequestStateMachine(context);
    
    try {
      const result = await stateMachine.execute();
      return result;
    } catch (error) {
      // The state machine has handled the error callback, throw directly
      throw error;
    }
  };
};

// Export the state machine version as the default export
export default apolloStateMachine; 