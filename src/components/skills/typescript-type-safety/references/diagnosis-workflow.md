## 推荐流程

1. 先拿到完整 `tsc --noEmit` 输出。
2. 用脚本 `extract-ts-errors` 对错误按文件和错误码归组。
3. 先找上游合同漂移，再看下游类型症状。
4. 每次只消除一类根因，保留最小复现或类型示例。
5. 修复后重新跑 `tsc --noEmit` 和相关测试。

## 代码模式

用泛型替换 `any`、`unknown` + 类型守卫收口外部输入、判别联合穷尽校验等模式参考 Reference Map 中的 `advanced-patterns` 和 `rules`。

路由参数类型化、不可信输入解析、DTO 显式变换、单一 schema 推导、边界运行时校验见 Reference Map 中的 `code-patterns`。
