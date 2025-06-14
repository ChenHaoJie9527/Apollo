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
