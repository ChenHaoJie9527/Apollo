import type { StandardSchemaV1 } from "@standard-schema/spec";
import type { BaseOptions } from "./BaseOptions";
import type { HeadersObject } from "./HeadersObject";
import type { Method } from "./Method";
import type { MinFetchFn } from "./MinFetchFn";
import type { ParseResponse } from "./ParseResponse";
import type { SerializeBody } from "./SerializeBody";
import type { OnRetry } from "./OnRetry";
import type { ParseRejected } from "./ParseRejected";
import type { StreamingEvent } from "./StreamingEvent";

/**
 * FetcherOptions 是工具类型，用于从MinFetchFn的第二个参数options中，移除body、headers、method属性，并返回剩余的类型
 * Parameters<T>：TS内置高级类型，用于读取函数T的参数类型，返回一个元组，元组中包含所有参数的类型, [1]表示第二个参数options
 * NonNullable<T>：TS内置高级类型，用于移除T中的null和undefined类型
 * DistributiveOmit：工具类型，用于从T中移除K属性，并返回剩余的类型
 * NonNullable<Parameters<T>>[1]: 表示第二个参数options的类型，NonNullable用于移除null和undefined类型
 * & {}：用于添加一个空对象类型，表示剩余的类型必须是一个对象
 */
export type FetcherOptions<
  T extends MinFetchFn,
  TSchema extends StandardSchemaV1,
  TParsedData,
  TRawBody
> = BaseOptions<T> & {
  baseUrl?: string;
  body?: NoInfer<TRawBody> | undefined | null;
  headers?: HeadersInit | HeadersObject;
  method?: Method;
  params?: Record<string, any>;
  schema?: TSchema;
  parseRejected?: ParseRejected
  parseResponse?: ParseResponse<TParsedData>;
  serializeBody?: SerializeBody<TRawBody>;
  signal?: AbortSignal;
  timeout?: number;
  onRequest?: (request: Request) => void;
  onError?: (error: {}, request: Request) => void;
  onRetry?: OnRetry;
  onSuccess?: (data: any, request: Request) => void;
  onRequestStreaming?: (event: StreamingEvent, request: Request) => void;
  onResponseStreaming?: (event: StreamingEvent, response: Response) => void;
} & {};
