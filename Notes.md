### 泛型参数类型

```ts
function foo<T>(x: T) {}
foo("hello"); // T 推断为 string
```

### Const 泛型参数类型

```ts
function foo<const T>(x: T) {}
foo("hello"); // T 推断为 "hello"（字面量类型）
```

使用const 推断出来的T会尽量保持字面量类型，而不会宽泛化成为更通用的类型，相当于类型收窄

### DistributiveOmit类型

```ts
export type DistributiveOmit<
  T extends Object,
  K extends keyof T | string & {}
> = T extends unknown ? Omit<T, K> : never;
```

这是一个对联合类型分布式执行Omit再合并的工具类型，当传入联合类型T时，会分别对联合类型T的每个成员执行Omit操作，最后合并结果

1. 联合类型：联合类型（Union Types）是 TypeScript 中的一种类型，它表示一个值可以是多种类型中的任意一种。联合类型使用 | 符号来连接多个类型。

​	1.简单联合类型

```ts
type StringOrNumber = string | number;
let value: StringOrNumber;
value = "hello"; // 合法
value = 42;      // 合法
value = true;    // 错误，boolean 不是 StringOrNumber 类型
```

​	2.对象联合类型

```ts
   type Dog = { name: string; bark: () => void };
   type Cat = { name: string; meow: () => void };
   type Pet = Dog | Cat;

   let pet: Pet;
   pet = { name: "Rex", bark: () => console.log("Woof!") }; // 合法
   pet = { name: "Whiskers", meow: () => console.log("Meow!") }; // 合法
   pet = { name: "Fish", swim: () => console.log("Swim!") }; // 错误，swim 不是 Pet 类型
```

​	3.函数联合类型

```ts
   function processValue(value: string | number) {
     if (typeof value === "string") {
       console.log(value.toUpperCase());
     } else {
       console.log(value.toFixed(2));
     }
   }

   processValue("hello"); // 输出: HELLO
   processValue(42);      // 输出: 42.00
```

​	4.联合类型特点：

​		1.类型收窄 Type Narrowing

```ts
	     function processValue(value: string | number) {
   if (typeof value === "string") {
     // 这里 TypeScript 知道 value 是 string 类型
     console.log(value.toUpperCase());
   } else {
     // 这里 TypeScript 知道 value 是 number 类型
     console.log(value.toFixed(2));
   }
 }
```

​		2.公共属性访问

```ts
 type A = { a: string; b: number };
 type B = { a: string; c: boolean };
 type C = A | B;
 let c: C;
 c.a; // 合法，因为 a 是 A 和 B 共有的属性
 c.b; // 错误，因为 b 不是 B 的属性
 c.c; // 错误，因为 c 不是 A 的属性
```

2. Omit：TS内置工具类型，用于在一个类型中剔除指定的属性

   ```ts
     type A = { a: string; b: number };
     type B = Omit<A, "a">; // { b: number }
   ```

3. 分布式<Distributive>：当在联合类型上使用条件类型（如 T extends unknown ? ... : never）时，TypeScript 会自动对联合类型中的每个成员分别执行条件判断，然后再合并结果。`DistributiveOmit` 的作用是：在联合类型上“分发式”地执行 Omit 操作，避免直接 Omit 联合类型时的类型错误。

示例：

```ts
type A = { a: string; b: number };
type B = { a: string; c: boolean };
type C = A | B; // 联合类型 {a: number} | {c: boolean}
let c: C;
// DistributiveOmit 会分别对 A 和 B 执行 Omit<A, "a"> 和 Omit<B, "a">。
let d: DistributiveOmit<C, "a"> // {b: number} | {c: boolean}
```

4. BaseOptions 工具类型，用于从MinFetchFn的第二个参数options，移除body，method，headers属性，返回剩余的属性

   ```ts
   import type { MinFetchFn } from "./MinFetchFn";
   import type { DistributiveOmit } from "./DistributiveOmit";
   
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
   type MinFetchFn1 = (url: string, options: RequestInit) => Promise<Response>;
   type BaseOptions1 = Omit<RequestInit, "body" | "headers" | "method"> & {};
   
   const a: BaseOptions1 = {
     //   headers: {
     //     "Content-Type": "application/json",
     //   },
     //   body: {},
     //   method: "GET",
     // 不包含以上3种属性
   };
   ```

   

5. 

