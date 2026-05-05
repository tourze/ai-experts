# speckit-expert

Spec Kit 工作流专家能力，覆盖需求规格化、澄清、技术规划、任务拆解、实现执行与一致性分析。

## 目录结构

- `skills/`：16 个 `speckit-*` 中文技能；`speckit-baseline/` 内嵌初始化能力与规格模板。

## 工作流策略

- 默认在**当前分支**工作，不自动创建新分支。
- `speckit-specify` / `speckit-baseline` 会把当前 feature 写入 `.specify/feature.json`，供后续流程定位目录。
- 若没有 `.specify/feature.json` 或 `SPECIFY_FEATURE_DIRECTORY`，流程不会在普通分支上猜测 `specs/<branch>`；只兼容明确的 legacy feature 分支名。
- 仅当用户明确要求时才切换到“按分支驱动”的流程。

## 初始化（首次使用）

安装插件后，使用 `speckit-baseline` skill 的初始化流程建立项目 `.specify/` 基线。

## Skills

| Skill | 用途 |
|-------|------|
| `spec-driven-delivery` | 5 阶段需求驱动交付（Specify→Plan→Act→Review→Vault）外层纪律：10 分 spec 门禁 + `.sparv/journal.md` + 3 次失败协议 + EHRB 高风险显式确认；包裹 speckit 子流程使用 |
| `speckit-analyze` | 对 `spec.md` / `plan.md` / `tasks.md` 做一致性与完整性分析 |
| `speckit-baseline` | 从现有代码反向生成初始规格文档 |
| `speckit-checker` | 运行静态检查并汇总问题 |
| `speckit-checklist` | 基于当前特性生成需求质量检查清单 |
| `speckit-clarify` | 识别需求歧义并通过问答补全规格 |
| `speckit-constitution` | 建立或更新项目宪章并同步约束 |
| `speckit-diff` | 对比规格或计划版本差异 |
| `speckit-implement` | 按任务清单执行实现并控制回归风险 |
| `speckit-plan` | 从规格生成技术实现计划与设计产物 |
| `speckit-quizme` | 通过苏格拉底式追问挖掘规格薄弱点 |
| `speckit-reviewer` | 结构化代码审查与风险分级 |
| `speckit-specify` | 从自然语言需求生成 `spec.md` |
| `speckit-status` | 输出特性进度、完成度与阻塞项看板 |
| `speckit-tasks` | 从设计文档生成依赖有序的 `tasks.md` |
| `speckit-taskstoissues` | 将任务清单映射为 GitHub Issues |
| `speckit-validate` | 校验实现结果与规格要求是否一致 |

## Agents

| Agent | 用途 |
|-------|------|
| `speckit-driver` | 端到端编排 Spec Kit 交付：Specify→Clarify→Plan→Tasks→Implement→Validate→Status |

## 参考来源

- 社区参考：`https://github.com/dceoy/speckit-agent-skills`
- 官方参考：`https://github.com/github/spec-kit`

## 安装 / 卸载

由仓库根目录的 `node scripts/install.mjs` 统一管理（symlink skills/agents + 注入用户级 hooks）。详见仓库 README 的「快速开始」段。

## 验证

```bash
find plugins/speckit-expert/skills -name SKILL.md | wc -l
rg -n "^name: speckit-" plugins/speckit-expert/skills/*/SKILL.md
test -f plugins/speckit-expert/skills/speckit-baseline/templates/spec-template.md
test -f plugins/speckit-expert/skills/speckit-baseline/templates/plan-template.md
test -f plugins/speckit-expert/skills/speckit-baseline/templates/tasks-template.md
node --test plugins/speckit-expert/tests/*.test.mjs
```
