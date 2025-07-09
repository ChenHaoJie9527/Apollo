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
} from "./utils";
import { resolveUrl } from "./utils/resolve-url";

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

      request = await toStreamable(
        new Request(
          input?.url
            ? input // Request
            : resolveUrl(
                finalOptions.baseUrl,
                input as unknown as string | URL,
                defaultOptions.params,
                fetchOpts.params,
                finalOptions.serializeParams
              ),
          finalOptions as any
        ),
        finalOptions.onRequestStreaming
      );

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

      // 获取重试配置，确保有默认值
      const retryConfig = finalOptions.retry || {
        attempts: 0,
        delay: 0,
        when: () => false,
      };

      // 决定是否退出重试循环，有两个条件
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

    // 处理最终结果
    if (outcome.error) {
      finalOptions.onError?.(outcome.error, request);
      throw outcome.error;
    }

    const response = outcome.response as Response;

    // 判断响应是否被拒绝
    if (!(await (finalOptions.reject || (() => false))(response))) {
      // 成功路径：解析响应数据
      let parsed: any;
      try {
        parsed = finalOptions.parseResponse
          ? await finalOptions.parseResponse(response, request)
          : await response.json();
      } catch (error: any) {
        finalOptions.onError?.(error, request);
        throw error;
      }

      // Schema 验证（如果提供了 schema）
      let data: any;
      try {
        // 暂时跳过 schema 验证，将来可以添加
        data = finalOptions.schema
          ? parsed // TODO: 添加实际的 schema 验证
          : parsed;
      } catch (error: any) {
        finalOptions.onError?.(error, request);
        throw error;
      }

      finalOptions.onSuccess?.(data, request);
      return data;
    }

    // 失败路径：处理被拒绝的响应
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
