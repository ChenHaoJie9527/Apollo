import type { JsonObject } from "./JsonObject";
import type { JsonPrimitive } from "./JsonPrimitive";

/**
 * JsonArray 是一个联合类型，标识默认的请求体类型，可以是JsonObject类型，也可以是JsonPrimitive类型，也可以是ReadonlyArray类型
 * JsonObject: 表示JSON对象类型，是PropertyKey的子集，表示对象的属性键类型，可以是string, number, symbol等
 * JsonPrimitive: 表示JSON原始类型，可以是string, number, boolean, null, undefined
 * ReadonlyArray: 表示只读数组类型，是Array的子集，表示数组是只读的
 */
export type JsonArray = Array<
  JsonObject | Array<any> | JsonPrimitive | ReadonlyArray<any>
>;
