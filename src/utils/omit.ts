import type { DistributiveOmit } from "src/types/DistributiveOmit";

// Unit Testing of toStreamable Functions
type ValidateKeys<T, Keys extends readonly unknown[]> = Keys extends readonly [
  infer First,
  ...infer Rest
]
  ? First extends keyof T
    ? ValidateKeys<Omit<T, First>, Rest>
    : false
  : true;

// Recursively calculating the final result type
type OmitByKeys<T, Keys extends readonly unknown[]> = Keys extends readonly [
  infer First,
  ...infer Rest
]
  ? First extends keyof T
    ? OmitByKeys<Omit<T, First>, Rest>
    : OmitByKeys<T, Rest>
  : T;

/**
 * Intelligent omit functions - support for any number of keys and progressive type derivation
 * @param obj object
 * @param keys key list
 * @returns new object after deletion
 */
export function omit<T extends object>(obj: T): T;
export function omit<T extends object, K extends readonly (keyof T)[]>(
  obj: T,
  keys: ValidateKeys<T, K> extends true ? K : never
): OmitByKeys<T, K>;

// Generic Heavy Duty as a Backup
export function omit<T extends object, K extends keyof T>(
  obj: T,
  keys?: readonly K[] | K[]
): DistributiveOmit<T, K>;

// implementation function
export function omit<T extends object>(
  obj: T,
  keys: readonly (keyof T)[] = []
): any {
  if (!obj) return {};

  const copy = { ...obj } as any;
  for (const key of keys) {
    delete copy[key];
  }
  return copy;
}

// ========== Unit Testing ==========

// const user = {
//   name: "John",
//   age: 20,
//   email: "john@example.com",
//   phone: "1234567890",
//   address: "123 Main St, Anytown, USA",
//   city: "Anytown",
//   state: "CA",
//   zip: "12345",
// };

// // ✅ 支持任意数量的键
// const test1 = omit(user, ["email"] as const);
// const test2 = omit(user, ["email", "phone"] as const);
// const test3 = omit(user, ["email", "phone", "address"] as const);
// const test4 = omit(user, ["email", "phone", "address", "city"] as const);
// const test5 = omit(user, [
//   "email",
//   "phone",
//   "address",
//   "city",
//   "state",
// ] as const);
// const test6 = omit(user, [
//   "email",
//   "phone",
//   "address",
//   "city",
//   "state",
//   "zip",
// ] as const);
