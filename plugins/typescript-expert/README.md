# typescript-expert

TypeScript 开发专家插件，提供显式 manifest 注册、`PostToolUse Edit|Write` 守卫、统一结构的技能文档，以及针对脚本/文档的本地测试。

## 目录

- `.claude-plugin/plugin.json`：插件 manifest，显式声明 `skills/` 与 `hooks/hooks.json`，不再使用无效 `dependencies` 对象。
- `hooks/`：`hooks.json`、`dispatch.mjs` 与 5 个 `PostToolUse Edit|Write` 守卫。
- `skills/`：3 份 TypeScript 主题技能文档，统一采用「适用场景 → 核心约束 → 代码模式 → 检查清单 → 反模式」结构。
- `tests/`：校验 manifest、dispatch、脚本语法与技能文档结构/链接。

## Skills

| Skill | 用途 |
|-------|------|
| `typescript-advanced-types` | 高级类型系统与类型推导模式：泛型、条件类型、映射类型、模板字面量类型 |
| `typescript-magician` | 复杂泛型设计、`any` 清理、类型守卫、编译错误定位与规则索引 |
| `offensive-typesafety` | 把路由、输入、DTO 与数据库边界升级为编译器可验证合同 |

## Hooks

| 事件 | Hook | 作用 |
|------|------|------|
| PostToolUse Edit\|Write | `syntax-typescript` | esbuild transformSync 语法验证 |
| PostToolUse Edit\|Write | `lint-eslint` | 使用项目本地 `eslint` 包执行代码质量检查 |
| PostToolUse Edit\|Write | `debug-statement-guard` | console.log / debugger 检测 |
| PostToolUse Edit\|Write | `encoding-guard` | 文件编码检查（BOM / 非 UTF-8） |
| PostToolUse Edit\|Write | `file-budget-guard` | TS 文件行数预算（500 行） |

## 协作插件

- `javascript-expert`：推荐协作插件。适合需要同时覆盖 JS/TS 双栈守卫、测试模式和迁移策略的场景。
- `syntax-typescript` 只有在本地可解析到 `esbuild` 时才执行语法检查；找不到依赖时会静默跳过。
- `lint-eslint` 只有在向上找到 `eslint.config.*` 且本地安装 `eslint` 包时才执行。

## 安装

```bash
claude --plugin-dir /path/to/plugins/typescript-expert
```

如果要通过本仓库根目录注册的 `ai-experts` marketplace 持久安装：

```bash
claude plugin install typescript-expert@ai-experts
claude plugin install typescript-expert@ai-experts --scope project
```

## 卸载

```bash
claude plugin uninstall typescript-expert
claude plugin uninstall typescript-expert --scope project
```

如果只是通过 `claude --plugin-dir ...` 临时加载，则不需要执行卸载；结束当前会话或下次启动时去掉 `--plugin-dir` 即可。

建议同时安装 `javascript-expert` 插件以获得完整的 JS/TS 开发体验。

## 验证

```bash
jq empty plugins/typescript-expert/.claude-plugin/plugin.json
jq empty plugins/typescript-expert/hooks/hooks.json
node --check plugins/typescript-expert/hooks/dispatch.mjs
node --test plugins/typescript-expert/tests/*.test.mjs
```
