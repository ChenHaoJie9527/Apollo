import type { BaseOptions } from "./BaseOptions";
import type { HeadersObject } from "./HeadersObject";
import type { Method } from "./Method";
import type { MinFetchFn } from "./MinFetchFn";
import type { ParseResponse } from "./ParseResponse";
import type { SerializeBody } from "./SerializeBody";
import type { RetryOptions } from "./RetryOptions";
import type { OnRetry } from "./OnRetry";

/**
 * Default configuration options for the client
 * @baseUrl: The base URL, usually the public prefix of the backend interface
 * @headers: Request headers, usually some default configurations of request headers
 * @method: Request method, usually some default configurations of request methods
 * @params: Request parameters, usually some default configurations of request parameters
 * @parseResponse: Response parsing function, usually some default configurations of response parsing functions
 * @serializeBody: Request body serialization function, usually some default configurations of request body serialization functions
 */
export type DefaultOptions<
  T extends MinFetchFn,
  TDefaultParseData,
  TDefaultRawBody
> = BaseOptions<T> & {
  baseUrl?: string;
  headers?: HeadersInit | HeadersObject; //headerInit: TS built-in type, represents the type of fetch's headers parameter
  method?: Method;
  params?: Record<string, any>;
  parseResponse?: ParseResponse<TDefaultParseData>;
  serializeBody?: SerializeBody<TDefaultRawBody>;
  retry?: RetryOptions;
  signal?: AbortSignal;
  timeout?: number;
  onRequest?: (request: Request) => void;
  onError?: (error: {}, request: Request) => void;
  onRetry?: OnRetry;
  onSuccess?: (data: any, request: Request) => void;
};
