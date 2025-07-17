import type { DistributiveOmit } from "src/types/DistributiveOmit";

// Simplified omit function - both simple and type hinting
export function omit<O extends object, K extends keyof O>(
	obj: O,
	keys: K[] | readonly K[] = [],
): DistributiveOmit<O, K> {
	if (!obj) return {} as any;

	const copy = { ...obj } as any;
	for (const key of keys) {
		if (key in copy) {
			delete copy[key];
		}
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

// const test1 = omit(user, ["email", "name", "state", "zip"]);
// const test2 = omit(user, ["email", "name", "state", "zip"] as const);
