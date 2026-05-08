# 高级现代 JavaScript 模式

涵盖函数式编程、现代类特性、ES6 模块、迭代器、生成器、现代运算符和性能优化的高级模式。

## 函数式编程模式

### 1. 数组方法

**Map、Filter、Reduce：**

```javascript
const users = [
  { id: 1, name: "John", age: 30, active: true },
  { id: 2, name: "Jane", age: 25, active: false },
  { id: 3, name: "Bob", age: 35, active: true },
];

// Map - 转换数组
const names = users.map((user) => user.name);
const upperNames = users.map((user) => user.name.toUpperCase());

// Filter - 筛选元素
const activeUsers = users.filter((user) => user.active);
const adults = users.filter((user) => user.age >= 18);

// Reduce - 聚合数据
const totalAge = users.reduce((sum, user) => sum + user.age, 0);
const avgAge = totalAge / users.length;

// 按属性分组
const byActive = users.reduce((groups, user) => {
  const key = user.active ? "active" : "inactive";
  return {
    ...groups,
    [key]: [...(groups[key] || []), user],
  };
}, {});

// 链式调用
const result = users
  .filter((user) => user.active)
  .map((user) => user.name)
  .sort()
  .join(", ");
```

**高级数组方法：**

```javascript
// Find - 第一个匹配元素
const user = users.find((u) => u.id === 2);

// FindIndex - 第一个匹配的索引
const index = users.findIndex((u) => u.name === "Jane");

// Some - 至少一个匹配
const hasActive = users.some((u) => u.active);

// Every - 全部匹配
const allAdults = users.every((u) => u.age >= 18);

// FlatMap - 映射并展平
const userTags = [
  { name: "John", tags: ["admin", "user"] },
  { name: "Jane", tags: ["user"] },
];
const allTags = userTags.flatMap((u) => u.tags);

// From - 从可迭代对象创建数组
const str = "hello";
const chars = Array.from(str);
const numbers = Array.from({ length: 5 }, (_, i) => i + 1);

// Of - 从参数创建数组
const arr = Array.of(1, 2, 3);
```

### 2. 高阶函数

**函数作为参数：**

```javascript
// 自定义 forEach
function forEach(array, callback) {
  for (let i = 0; i < array.length; i++) {
    callback(array[i], i, array);
  }
}

// 自定义 map
function map(array, transform) {
  const result = [];
  for (const item of array) {
    result.push(transform(item));
  }
  return result;
}

// 自定义 filter
function filter(array, predicate) {
  const result = [];
  for (const item of array) {
    if (predicate(item)) {
      result.push(item);
    }
  }
  return result;
}
```

**函数返回函数：**

```javascript
// 柯里化
const multiply = (a) => (b) => a * b;
const double = multiply(2);
const triple = multiply(3);

console.log(double(5)); // 10
console.log(triple(5)); // 15

// 偏函数应用
function partial(fn, ...args) {
  return (...moreArgs) => fn(...args, ...moreArgs);
}

const add = (a, b, c) => a + b + c;
const add5 = partial(add, 5);
console.log(add5(3, 2)); // 10

// 记忆化
function memoize(fn) {
  const cache = new Map();
  return (...args) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}

const fibonacci = memoize((n) => {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
});
```

### 3. 组合与管道

```javascript
// 函数组合
const compose =
  (...fns) =>
  (x) =>
    fns.reduceRight((acc, fn) => fn(acc), x);

const pipe =
  (...fns) =>
  (x) =>
    fns.reduce((acc, fn) => fn(acc), x);

// 示例用法
const addOne = (x) => x + 1;
const double = (x) => x * 2;
const square = (x) => x * x;

const composed = compose(square, double, addOne);
console.log(composed(3)); // ((3 + 1) * 2)^2 = 64

const piped = pipe(addOne, double, square);
console.log(piped(3)); // ((3 + 1) * 2)^2 = 64

// 实际示例
const processUser = pipe(
  (user) => ({ ...user, name: user.name.trim() }),
  (user) => ({ ...user, email: user.email.toLowerCase() }),
  (user) => ({ ...user, age: parseInt(user.age) }),
);

const user = processUser({
  name: "  John  ",
  email: "JOHN@EXAMPLE.COM",
  age: "30",
});
```

### 4. 纯函数与不可变性

```javascript
// 不纯的函数（修改输入）
function addItemImpure(cart, item) {
  cart.items.push(item);
  cart.total += item.price;
  return cart;
}

// 纯函数（无副作用）
function addItemPure(cart, item) {
  return {
    ...cart,
    items: [...cart.items, item],
    total: cart.total + item.price,
  };
}

// 不可变数组操作
const numbers = [1, 2, 3, 4, 5];

// 添加到数组
const withSix = [...numbers, 6];

// 从数组移除
const withoutThree = numbers.filter((n) => n !== 3);

// 更新数组元素
const doubled = numbers.map((n) => (n === 3 ? n * 2 : n));

// 不可变对象操作
const user = { name: "John", age: 30 };

// 更新属性
const olderUser = { ...user, age: 31 };

// 添加属性
const withEmail = { ...user, email: "john@example.com" };

// 删除属性
const { age, ...withoutAge } = user;

// 深拷贝（简单方法）
const deepClone = (obj) => JSON.parse(JSON.stringify(obj));

// 更好的深拷贝
const structuredClone = (obj) => globalThis.structuredClone(obj);
```

## 现代类特性

```javascript
// 类语法
class User {
  // 私有字段
  #password;

  // 公有字段
  id;
  name;

  // 静态字段
  static count = 0;

  constructor(id, name, password) {
    this.id = id;
    this.name = name;
    this.#password = password;
    User.count++;
  }

  // 公有方法
  greet() {
    return `Hello, ${this.name}`;
  }

  // 私有方法
  #hashPassword(password) {
    return `hashed_${password}`;
  }

  // Getter
  get displayName() {
    return this.name.toUpperCase();
  }

  // Setter
  set password(newPassword) {
    this.#password = this.#hashPassword(newPassword);
  }

  // 静态方法
  static create(id, name, password) {
    return new User(id, name, password);
  }
}

// 继承
class Admin extends User {
  constructor(id, name, password, role) {
    super(id, name, password);
    this.role = role;
  }

  greet() {
    return `${super.greet()}, I'm an admin`;
  }
}
```

## 模块（ES6）

```javascript
// 导出
// math.js
export const PI = 3.14159;
export function add(a, b) {
  return a + b;
}
export class Calculator {
  // ...
}

// 默认导出
export default function multiply(a, b) {
  return a * b;
}

// 导入
// app.js
import multiply, { PI, add, Calculator } from "./math.js";

// 重命名导入
import { add as sum } from "./math.js";

// 全部导入
import * as Math from "./math.js";

// 动态导入
const module = await import("./math.js");
const { add } = await import("./math.js");

// 条件加载
if (condition) {
  const module = await import("./feature.js");
  module.init();
}
```

## 迭代器和生成器

```javascript
// 自定义迭代器
const range = {
  from: 1,
  to: 5,

  [Symbol.iterator]() {
    return {
      current: this.from,
      last: this.to,

      next() {
        if (this.current <= this.last) {
          return { done: false, value: this.current++ };
        } else {
          return { done: true };
        }
      },
    };
  },
};

for (const num of range) {
  console.log(num); // 1, 2, 3, 4, 5
}

// 生成器函数
function* rangeGenerator(from, to) {
  for (let i = from; i <= to; i++) {
    yield i;
  }
}

for (const num of rangeGenerator(1, 5)) {
  console.log(num);
}

// 无限生成器
function* fibonacci() {
  let [prev, curr] = [0, 1];
  while (true) {
    yield curr;
    [prev, curr] = [curr, prev + curr];
  }
}

// 异步生成器
async function* fetchPages(url) {
  let page = 1;
  while (true) {
    const response = await fetch(`${url}?page=${page}`);
    const data = await response.json();
    if (data.length === 0) break;
    yield data;
    page++;
  }
}

for await (const page of fetchPages("/api/users")) {
  console.log(page);
}
```

## 现代运算符

```javascript
// 可选链
const user = { name: "John", address: { city: "NYC" } };
const city = user?.address?.city;
const zipCode = user?.address?.zipCode; // undefined

// 函数调用
const result = obj.method?.();

// 数组访问
const first = arr?.[0];

// 空值合并
const value = null ?? "default"; // 'default'
const value = undefined ?? "default"; // 'default'
const value = 0 ?? "default"; // 0（不是 'default'）
const value = "" ?? "default"; // ''（不是 'default'）

// 逻辑赋值
let a = null;
a ??= "default"; // a = 'default'

let b = 5;
b ??= 10; // b = 5（不变）

let obj = { count: 0 };
obj.count ||= 1; // obj.count = 1
obj.count &&= 2; // obj.count = 2
```

## 性能优化

```javascript
// 防抖
function debounce(fn, delay) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

const searchDebounced = debounce(search, 300);

// 节流
function throttle(fn, limit) {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

const scrollThrottled = throttle(handleScroll, 100);

// 惰性求值
function* lazyMap(iterable, transform) {
  for (const item of iterable) {
    yield transform(item);
  }
}

// 只使用所需内容
const numbers = [1, 2, 3, 4, 5];
const doubled = lazyMap(numbers, (x) => x * 2);
const first = doubled.next().value; // 仅计算第一个值
```

## 常见陷阱

1. **this 绑定混淆**：使用箭头函数或 bind()
2. **Async/await 缺少错误处理**：始终使用 try/catch
3. **不必要的 Promise 创建**：不要包装已经是异步的函数
4. **对象突变**：使用展开运算符或 Object.assign()
5. **忘记 await**：异步函数返回 promise
6. **阻塞事件循环**：避免同步操作
7. **内存泄漏**：清理事件监听器和定时器
8. **未处理 promise 拒绝**：使用 catch() 或 try/catch
