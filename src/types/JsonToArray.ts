import type { JsonPrimitive } from "./JsonPrimitive";
import type { JsonToObject } from "./JsonToObject";

/**
 * 定义可序列化为JSON的数组类型
 * 1. 使用JsonPrimitive类型，表示数组元素类型，可以是string, number, boolean, null, undefined
 * 2. 使用JsonToObject类型，表示数组元素类型，可以是JsonObject类型
 * 3. 使用Array类型，表示数组元素类型，可以是any类型
 * 4. 使用ReadonlyArray类型，表示数组元素类型，可以是any类型
 * 5. 使用ReadonlyArray类型，表示数组元素类型，可以是JsonPrimitive | JsonToObject | JsonToArray类型
 */
export type JsonToArray = Array<
  | JsonPrimitive
  | JsonToObject
  | Array<any>
  | ReadonlyArray<any>
  | ReadonlyArray<JsonPrimitive | JsonToObject | JsonToArray>
>;
