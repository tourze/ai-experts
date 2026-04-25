---
name: architecture-blueprint-generator
description: "当用户要为现有代码库生成架构蓝图、模块边界、依赖规则、数据流或扩展点治理文档时使用。英文触发词 architecture blueprint / module boundaries / dependency rules。"
---

# architecture-blueprint-generator

## 适用场景
- 适合新成员入场、架构治理、重构前摸底和长期维护文档补齐。
- 适合从现有实现反推真实架构，而不是只复述理想设计。
- 交叉引用：需要可视化时配合 `architecture-diagram`；需要风险判断时配合 `architecture-reviewer`。

## 核心约束
- 蓝图必须基于真实代码、配置和目录结构，不要虚构不存在的层或服务。
- 优先记录边界、依赖方向、扩展点和横切关注点，而不是堆砌组件名。
- 如果存在混合架构，要明确写出“主模式 + 偏离点 + 原因”。
- 输出要服务后续维护，不能写成一次性方案宣讲稿。

## 代码模式
- 先识别技术栈、构建工具、部署配置和模块边界，再决定蓝图章节。
- 建议输出到 `docs/architecture/Project_Architecture_Blueprint.md` 或用户指定路径。
- 章节顺序推荐：总体概览 → 模块边界 → 依赖规则 → 数据架构 → 横切关注点 → 扩展建议。

```markdown
# Project Architecture Blueprint

## 1. 总体概览
## 2. 模块边界
## 3. 依赖规则
## 4. 数据流与状态
## 5. 扩展点与治理建议
```

## 检查清单
- 是否说明了目录结构、模块职责和依赖方向。
- 是否单列了认证、配置、日志、错误处理、缓存等横切关注点。
- 是否记录了关键扩展点、插件点和定制入口。
- 是否指出文档与实现不一致之处。

## 反模式

### FAIL: 画"应该"而非"是"

```md
## 架构
- Domain 层（纯业务）
- Application 层（编排）
- Infrastructure 层（外部）
→ 实际：Controller 直接调 Repository，"Domain 层"几乎是空的
→ 新人按蓝图找不到对应代码
```

### PASS: 反映真实

```md
## 当前架构（含偏离）
- 主模式：Layered（Controller → Service → Repo）
- 偏离 1：UserController.export 直接 SQL（src/.../UserController.kt:120）
  - 原因：性能优化，绕过 ORM
  - 风险：测试覆盖低
- 偏离 2：缺独立 Domain 层（业务规则散布在 Service）
→ 既写真实又指出整改方向
```

### FAIL: 只画组件图

```
[一张方框图]
→ "API → BFF → Service → DB"
→ 缺：依赖方向、循环依赖、跨边界 import
```

### PASS: 边界 + 依赖规则

```md
## 依赖规则
✓ apps/* 可依赖 packages/shared-core
✓ packages/shared-core 可依赖 packages/utils
✗ packages/shared-core 不得依赖 apps/*（用 ESLint import/no-restricted-paths 强制）
违规：3 处（见 ARCH_VIOLATIONS.md）
```
