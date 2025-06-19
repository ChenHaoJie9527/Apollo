import type { JsonArray } from "./JsonArray";
import type { JsonObject } from "./JsonObject";

/**
 * TDefaultOptions 是一个联合类型，标识默认的请求体类型，可以是BodyInit类型，也可以是JsonObject类型
 * BodyInit：TS内置类型，表示请求体类型，支持fetch的body参数类型，可以说string, Blob，FormData，ArrayBuffer，ArrayBufferView，URLSearchParams，ReadableStream等
 * PropertyKey: TS内置类型，表示对象的属性键类型，可以是string, number, symbol等
 * JsonObject: 表示JSON对象类型，是PropertyKey的子集，表示对象的属性键类型，可以是string, number, symbol等
 * JsonArray: 表示JSON数组类型，是Array的子集，表示数组是只读的
 */
export type DefaultRawBody = BodyInit | JsonObject | JsonArray;
