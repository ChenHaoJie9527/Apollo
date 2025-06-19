import type { DefaultOptions } from "./DefaultOptions";
import type { DefaultRawBody } from "./DefaultRawBody";
import type { MinFetchFn } from "./MinFetchFn";

/**
 * 辅助类型，判断是否为null
 * 问题：为什么使用元祖包装
 * 回答：因为unknown类型无法直接判断是否为null，所以需要使用元祖包装
 * 问题：使用元祖包装后，发生什么变化
 * 回答：使用元祖包装后，可以判断是否为null，因为null类型可以被赋值给元祖类型
 */
type IsNull<T> = [T] extends [null] ? true : false;
// 示例：
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
 * 辅助类型，判断是否为unknown
 * 但排除 null 类型 因为 null 类型可以被赋值给任何类型 null extends unknown 为真
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
