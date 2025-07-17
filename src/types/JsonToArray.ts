import type { JsonPrimitive } from "./JsonPrimitive";
import type { JsonToObject } from "./JsonToObject";

/**
 * Define the array type that can be serialized to JSON
 * 1. Use JsonPrimitive type, representing the array element type, which can be string, number, boolean, null, undefined
 * 2. Use JsonToObject type, representing the array element type, which can be JsonObject type
 * 3. Use Array type, representing the array element type, which can be any type
 * 4. Use ReadonlyArray type, representing the array element type, which can be any type
 * 5. Use ReadonlyArray type, representing the array element type, which can be JsonPrimitive | JsonToObject | JsonToArray type
 */
export type JsonToArray = Array<
	| JsonPrimitive
	| JsonToObject
	| Array<any>
	| ReadonlyArray<any>
	| ReadonlyArray<JsonPrimitive | JsonToObject | JsonToArray>
>;
