## 摘要

- 用户可见的变化是什么
- 为什么需要这个改动

## 影响范围

- 涉及插件：
- 是否新增 / 修改 / 删除 skill：
- 是否触及 hooks（含 dispatch）：
- 是否影响 `install.mjs` / sync 脚本：

## 必跑清单

- [ ] `npm test`
- [ ] `npm run install:dry`
- [ ] 新增 / 修改 skill 已有对应 trigger eval 或测试
- [ ] 新增插件已在 `CLAUDE.md` 的"已声明的插件依赖"段落补充依赖声明
- [ ] 改动未跨插件 import 其他插件源码（自包含约束）

## 风险

- 兼容性 / 行为 / 发布风险
- 回滚策略（必要时）
