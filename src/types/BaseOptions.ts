import type { DistributiveOmit } from "./DistributiveOmit";
import type { MinFetchFn } from "./MinFetchFn";

/**
 * BaseOptions is a tool type used to remove the body, headers, and method properties from the second parameter options of MinFetchFn, and return the remaining type
 * Parameters<T>: TS built-in advanced type, used to read the parameter type of function T, return a tuple, the tuple contains the type of all parameters, [1] represents the second parameter options
 * NonNullable<T>: TS built-in advanced type, used to remove the null and undefined types from T
 * DistributiveOmit: tool type, used to remove the K property from T and return the remaining type
 * NonNullable<Parameters<T>>[1]: represents the type of the second parameter options, NonNullable is used to remove the null and undefined types
 * & {}: used to add an empty object type, indicating that the remaining type must be an object
 */
export type BaseOptions<T extends MinFetchFn> = DistributiveOmit<
	NonNullable<Parameters<T>>[1],
	"body" | "headers" | "method"
> & {};

//Example:
// type MinFetchFn1 = (url: string, options: RequestInit) => Promise<Response>;
// type BaseOptions1 = Omit<RequestInit, "body" | "headers" | "method"> & {};

// const a: BaseOptions1 = {
// 	//   headers: {
// 	//     "Content-Type": "application/json",
// 	//   },
// 	//   body: {},
// 	//   method: "GET",
// 	// Does not contain the above 3 properties
// };
