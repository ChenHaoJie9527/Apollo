import type { JsonArray } from "./JsonArray";
import type { JsonObject } from "./JsonObject";

/**
 * DefaultRawBody is a union type, identifying the default request body type, which can be of type BodyInit or JsonObject
 * BodyInit: TS built-in type, represents the request body type, supports the body parameter type of fetch, which can be string, Blob, FormData, ArrayBuffer, ArrayBufferView, URLSearchParams, ReadableStream, etc.
 * PropertyKey: TS built-in type, represents the property key type of an object, which can be string, number, symbol, etc.
 * JsonObject: represents the JSON object type, which is a subset of PropertyKey, representing the property key type of an object, which can be string, number, symbol, etc.
 * JsonArray: represents the JSON array type, which is a subset of Array, indicating that the array is read-only
 */
export type DefaultRawBody = BodyInit | JsonObject | JsonArray;
