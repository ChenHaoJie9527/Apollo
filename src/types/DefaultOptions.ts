import type { BaseOptions } from "./BaseOptions";
import type { HeadersObject } from "./HeadersObject";
import type { Method } from "./Method";
import type { MinFetchFn } from "./MinFetchFn";
import type { ParseResponse } from "./ParseResponse";
import type { SerializeBody } from "./SerializeBody";
import type { RetryOptions } from "./RetryOptions";

/**
 * 客户端的默认配置选项
 * @baseUrl: 基础URL 通常是后端接口的公共前缀
 * @headers: 请求头 通常是请求头的一些默认配置
 * @method: 请求方法 通常是请求方法的一些默认配置
 * @params: 请求参数 通常是请求参数的一些默认配置
 * @parseResponse: 响应解析函数 通常是响应解析函数的一些默认配置
 * @serializeBody: 请求体序列化函数 通常是请求体序列化函数的一些默认配置
 */
export type DefaultOptions<
  T extends MinFetchFn,
  TDefaultParseData,
  TDefaultRawBody
> = BaseOptions<T> & {
  baseUrl?: string;
  headers?: HeadersInit | HeadersObject; //headerInit: TS内置类型，表示fetch的headers参数类型
  method?: Method;
  params?: Record<string, any>;
  parseResponse?: ParseResponse<TDefaultParseData>;
  serializeBody?: SerializeBody<TDefaultRawBody>;
  retry?: RetryOptions;
  signal?: AbortSignal;
  timeout?: number;
};
