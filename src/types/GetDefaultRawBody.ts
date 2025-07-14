import type { DefaultOptions } from "./DefaultOptions";
import type { DefaultRawBody } from "./DefaultRawBody";
import type { MinFetchFn } from "./MinFetchFn";

/**
 * Helper type, determine if it is null
 * Question: Why use tuple packaging
 * Answer: Because the unknown type cannot be directly determined to be null, so it needs to be packaged with a tuple
 * Question: What happens after using tuple packaging
 * Answer: After using tuple packaging, it can be determined whether it is null, because the null type can be assigned to the tuple type
 */
type IsNull<T> = [T] extends [null] ? true : false;
// Example:
// type IsNull1 = IsNull<null> // true
// type IsNull2 = IsNull<undefined> // false
// type IsNull3 = IsNull<string> // false
// type IsNull4 = IsNull<number> // false
// type IsNull5 = IsNull<boolean> // false
// type IsNull6 = IsNull<object> // false
// type IsNull7 = IsNull<any> // true
// type IsNull8 = IsNull<never> // true
// type IsNull9 = IsNull<unknown> // false
// type IsNull10 = IsNull<void> // false
// type IsNull11 = IsNull<symbol> // false
// type IsNull12 = IsNull<bigint> // false
// type IsNull13 = IsNull<{ a: 1 }> // false
// type IsNull14 = IsNull<string | null> // false
// type IsNull15 = IsNull<string | undefined> // false
// type IsNull16 = IsNull<string | null | undefined> // false
// type IsNull17 = IsNull<string | null | undefined | number> // false
// type IsNull18 = IsNull<string | null | undefined | number | boolean> // false
// type IsNull19 = IsNull<string | null | undefined | number | boolean | object> // false
// type IsNull20 = IsNull<string | null | undefined | number | boolean | object | symbol> // false

/**
 * Helper type, determine if it is unknown
 * But exclude null type because null type can be assigned to any type null extends unknown is true
 */
type IsUnknown<T> = unknown extends T
	? IsNull<T> extends false
		? true
		: false
	: false;

export type GetDefaultRawBody<TDefaultOptions> =
	TDefaultOptions extends DefaultOptions<MinFetchFn, any, infer U>
		? IsUnknown<U> extends true
			? DefaultRawBody
			: U
		: never;
