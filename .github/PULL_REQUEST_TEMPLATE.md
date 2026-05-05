## 摘要

- 用户可见的变化是什么
- 为什么需要这个改动

## 影响范围

- 涉及组件：
- 是否新增 / 修改 / 删除 skill：
- 是否新增 / 修改 / 删除 agent：
- 是否触及 hooks / dispatcher：
- 是否影响 `dist/claude` / `dist/codex` 输出：

## 必跑清单

- [ ] `npm test`
- [ ] `npm run check:components`
- [ ] `npm run build:components`
- [ ] 新增 / 修改 skill 已登记 scripts / references / assets
- [ ] agent/profile 通过 import 后读取 `.id` 引用 skill，不在引用处手写 skill id

## 风险

- 兼容性 / 行为 / 发布风险
- 回滚策略（必要时）
