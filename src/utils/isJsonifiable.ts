import type { JsonToArray } from "../types/JsonToArray";
import type { JsonToObject } from "../types/JsonToObject";

const isPlainObject = (value: any): value is Record<string, any> => {
	return value && Object.prototype.toString.call(value) === "[object Object]";
};

export const isJsonifiable = (
	value: any,
): value is JsonToObject | JsonToArray => {
	return (
		isPlainObject(value) ||
		Array.isArray(value) ||
		(value && typeof value.toJSON === "function")
	);
};
