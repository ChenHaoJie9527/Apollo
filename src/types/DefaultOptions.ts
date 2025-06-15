import type { BaseOptions } from "./BaseOptions";
import type { MaybePromise } from "./MaybePromise";
import type { MinFetchFn } from "./MinFetchFn";

type Method =
  | "GET"
  | "POST"
  | "PUT"
  | "DELETE"
  | "PATCH"
  | "OPTIONS"
  | "HEAD"
  | "CONNECT"
  | "TRACE"
  | (string & {});

type HeadersObject = Record<string, string | number | undefined | null>;


type ParseResponse<T> = (
  response: Response,
  request: Request
) => MaybePromise<T>;

type SerializeBody<T> = (body: T) => BodyInit | null | undefined;

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
};
