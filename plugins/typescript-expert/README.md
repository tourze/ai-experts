# typescript-expert

TypeScript 与 NestJS 开发专家能力，提供 `PostToolUse Edit|Write` 守卫、统一结构的技能文档，以及针对工具/文档的本地测试。

## 目录

- `hooks/`：4 个本地 `PostToolUse Edit|Write` 守卫。
- `skills/`：3 份技能文档（2 份 TypeScript 核心 + 1 份 NestJS），统一采用「适用场景 → 核心约束 → 代码模式 → 检查清单 → 反模式」结构。
- `tests/`：工具语法与技能文档结构/链接校验。

## Skills

| Skill | 用途 |
|-------|------|
| `typescript-magician` | 复杂泛型设计、`any` 清理、类型守卫、条件类型/映射类型/模板字面量、编译错误定位 |
| `offensive-typesafety` | 把路由、输入、DTO 与数据库边界升级为编译器可验证合同 |
| `nestjs-layering-patterns` | NestJS 模块分层、DI、Controller/Provider、Pipe/Guard/Interceptor 和测试结构 |

## Agents

| Agent | 用途 |
|-------|------|
| `typescript-reviewer` | perform a TypeScript-specific code review |
| `nestjs-reviewer` | 只读审查 NestJS 模块分层、DI、Controller/Provider、Pipe/Guard/Interceptor 和测试结构 |

## Hooks

| 事件 | Hook | 作用 |
|------|------|------|
| PostToolUse Edit\|Write | `syntax-typescript` | esbuild transformSync 语法验证 |
| PostToolUse Edit\|Write | `lint-eslint` | 使用项目本地 `eslint` 包执行代码质量检查 |
| PostToolUse Edit\|Write | `debug-statement-guard`（由 `coding-expert` 提供） | console.log / debugger 检测 |

通用 BOM / UTF-8 编码检查、跨语言调试语句检测和文件预算守卫统一由 [coding-expert](../coding-expert/README.md) 提供。

## 协作能力

- `javascript-expert`：推荐协作能力。适合需要同时覆盖 JS/TS 双栈守卫、测试模式和迁移策略的场景。
- `syntax-typescript` 只有在本地可解析到 `esbuild` 时才执行语法检查；找不到依赖时会静默跳过。
- `lint-eslint` 只有在向上找到 `eslint.config.*` 且本地安装 `eslint` 包时才执行。

## 安装 / 卸载

由仓库根目录的 `node scripts/install.mjs` 统一管理（symlink skills/agents + 注入用户级 hooks）。详见仓库 README 的「快速开始」段。

## 验证

```bash
node --test plugins/typescript-expert/tests/*.test.mjs
```
