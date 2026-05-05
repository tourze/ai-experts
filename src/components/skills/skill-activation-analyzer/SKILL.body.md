## 选择分析模式

| 场景 | 模式 | 动作 |
|------|------|------|
| 用户报告某次 skill 没触发或触发错误 | A：单次诊断 | 还原意图 → 模拟匹配 → 定位根因 |
| 要检查一组 skill 之间是否互相抢请求 | B：冲突检测 | 提取触发域 → 构建重叠矩阵 → 分类冲突 |
| 要对插件或仓库做路由全面体检 | C：健康度评估 | 覆盖度 + 区分度 + 触发词密度 + 排他指引 |
| 批量审查 description 文本质量 | D：静态文本审查 | 运行 `scripts/cso_audit.mjs`，检测 6 类违规（workflow_leak/output_leak/missing_trigger/tool_leak/too_long/too_short），修复指南见 `references/rewrite-examples.md` |

**MANDATORY — READ ENTIRE FILE**: 选定模式后，必须完整阅读 `references/diagnosis-modes.md` 中对应模式的详细流程。

## 核心原则

Skill 路由成败取决于三件事：
1. **描述与意图的匹配** — description 是否覆盖了用户真实意图的表达方式
2. **描述之间的区分度** — 相似 skill 的 description 能否让 Claude 一次选对
3. **触发链路完整性** — 从用户消息到 skill 加载之间有无断点

## 与其他 skill-expert 技能的分工

| 技能 | 关注点 |
|------|--------|
| `skill-evaluator` | skill **整体设计质量**（知识增量、结构、自由度）和**知识覆盖验证** |
| `skill-activation-analyzer` | skill **触发行为质量**（命中、漏触发、误触发、冲突）+ **description 文本质量**（静态审查） |

## NEVER

- NEVER 只看 description 文本就下结论——必须还原用户意图再做匹配分析
- NEVER 建议合并两个 skill 来解决冲突——优先通过 description 区分度解决
- NEVER 忽略插件层级——基座层/语言层/框架层即使关键词重叠也可能不是真冲突
- NEVER 把"触发域宽"等同于"触发质量差"——有些 skill 本身就是宽口径入口
- NEVER 修改 SKILL.md 正文来解决触发问题——触发问题只能通过修改 description 解决
