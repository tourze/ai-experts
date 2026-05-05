## 推荐流程

1. 先拿到完整 `tsc --noEmit` 输出。
2. 用脚本 `extract-ts-errors` 对错误按文件和错误码归组。
3. 先找上游合同漂移，再看下游类型症状。
4. 每次只消除一类根因，保留最小复现或类型示例。
5. 修复后重新跑 `tsc --noEmit` 和相关测试。

## 代码模式

用泛型替换 `any`、`unknown` + 类型守卫收口外部输入、判别联合穷尽校验等模式参考 Reference Map 中的 `advanced-patterns` 和 `rules`。

路由参数类型化、不可信输入解析、DTO 显式变换、单一 schema 推导、边界运行时校验见 Reference Map 中的 `code-patterns`。

## 反模式

### FAIL: 用断言掩盖合同不一致

```ts
const user = fetchUser() as User; // as 只骗编译器
```

### PASS: 用类型守卫收口

```ts
const raw = fetchUser();
if (!isUser(raw)) throw new Error("invalid user shape");
```

### FAIL: schema 漂移前端加可选链兜底

修前端可选链只能让错误更晚暴露。先修上游合同，必要时用 parser 把边界输入变成显式成功/失败。
