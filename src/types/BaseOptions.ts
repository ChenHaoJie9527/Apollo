import type { DistributiveOmit } from "./DistributiveOmit";
import type { MinFetchFn } from "./MinFetchFn";

/**
 * BaseOptions 是工具类型，用于从MinFetchFn的第二个参数options中，移除body、headers、method属性，并返回剩余的类型
 * Parameters<T>：TS内置高级类型，用于读取函数T的参数类型，返回一个元组，元组中包含所有参数的类型, [1]表示第二个参数options
 * NonNullable<T>：TS内置高级类型，用于移除T中的null和undefined类型
 * DistributiveOmit：工具类型，用于从T中移除K属性，并返回剩余的类型
 * NonNullable<Parameters<T>>[1]: 表示第二个参数options的类型，NonNullable用于移除null和undefined类型
 * & {}：用于添加一个空对象类型，表示剩余的类型必须是一个对象
 */
export type BaseOptions<T extends MinFetchFn> = DistributiveOmit<
	NonNullable<Parameters<T>>[1],
	"body" | "headers" | "method"
> & {};

//示例:
// type MinFetchFn1 = (url: string, options: RequestInit) => Promise<Response>;
// type BaseOptions1 = Omit<RequestInit, "body" | "headers" | "method"> & {};

// const a: BaseOptions1 = {
// 	//   headers: {
// 	//     "Content-Type": "application/json",
// 	//   },
// 	//   body: {},
// 	//   method: "GET",
// 	// 不包含以上3种属性
// };
