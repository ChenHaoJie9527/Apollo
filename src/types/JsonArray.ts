import type { JsonObject } from "./JsonObject";
import type { JsonPrimitive } from "./JsonPrimitive";

/**
 * JsonArray is a union type, identifying the default request body type, which can be of type JsonObject, JsonPrimitive, or ReadonlyArray
 * JsonObject: represents the JSON object type, which is a subset of PropertyKey, representing the property key type of an object, which can be string, number, symbol, etc.
 * JsonPrimitive: represents the JSON primitive type, which can be string, number, boolean, null, undefined
 * ReadonlyArray: represents the readonly array type, which is a subset of Array, indicating that the array is read-only
 */
export type JsonArray = Array<
	JsonObject | Array<any> | JsonPrimitive | ReadonlyArray<any>
>;
