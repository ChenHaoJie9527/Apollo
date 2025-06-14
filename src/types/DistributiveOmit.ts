export type DistributiveOmit<
  T extends Object,
  K extends keyof T | string & {}
> = T extends unknown ? Omit<T, K> : never;

// Omit 类型用法
type A = { a: string; b: number };
type B = { a: string; c: boolean };
type C = A | B; // 联合类型 {a: number} | {c: boolean}
let c: C;

let d: DistributiveOmit<C, "a"> // {b: number} | {c: boolean}








