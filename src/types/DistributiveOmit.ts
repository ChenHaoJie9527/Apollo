export type DistributiveOmit<
	T extends Object,
	K extends keyof T | (string & {}),
> = T extends unknown ? Omit<T, K> : never;

// // Omit type usage
// type A = { a: string; b: number };
// type B = { a: string; c: boolean };
// type C = A | B; // Union type {a: number} | {c: boolean}
// let c: C;

// let d: DistributiveOmit<C, "a"> // {b: number} | {c: boolean}
