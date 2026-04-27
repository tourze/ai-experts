# speckit-expert

Spec Kit 工作流专家插件，覆盖需求规格化、澄清、技术规划、任务拆解、实现执行与一致性分析。

## 目录结构

- `skills/`：17 个 `speckit-*` 中文技能；`speckit-baseline/` 内嵌 `scripts/`（bootstrap、check-prerequisites、setup-plan 等）与 `templates/`（spec/plan/tasks/checklist/constitution）

## 工作流策略

- 默认在**当前分支**工作，不自动创建新分支。
- `speckit-specify` / `speckit-baseline` 会把当前 feature 写入 `.specify/feature.json`，供后续脚本定位目录。
- 若没有 `.specify/feature.json` 或 `SPECIFY_FEATURE_DIRECTORY`，脚本不会在普通分支上猜测 `specs/<branch>`；只兼容明确的 legacy feature 分支名。
- 仅当用户明确要求时才切换到“按分支驱动”的流程。

## 初始化（首次使用）

scripts/templates 现内嵌于 `speckit-baseline` skill。在用户机器上安装后，执行：

```bash
SPECKIT_HOME="$HOME/.claude/skills/speckit-baseline"
[ -d "$SPECKIT_HOME" ] || SPECKIT_HOME="$HOME/.codex/skills/speckit-baseline"
node "$SPECKIT_HOME/scripts/bootstrap-specify.mjs"
```

仓库内开发时直接：

```bash
node plugins/speckit-expert/skills/speckit-baseline/scripts/bootstrap-specify.mjs
```

该命令把 `scripts/` 与 `templates/` 同步到项目 `.specify/`。

## Skills

| Skill | 用途 |
|-------|------|
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
| `speckit-tester` | 执行测试并汇总覆盖率与结果 |
| `speckit-validate` | 校验实现结果与规格要求是否一致 |
| `spec-driven-delivery` | 5 阶段需求驱动交付（Specify→Plan→Act→Review→Vault）外层纪律：10 分 spec 门禁 + `.sparv/journal.md` + 3 次失败协议 + EHRB 高风险显式确认；包裹 speckit 子流程使用 |

## 参考来源

- 社区参考：`https://github.com/dceoy/speckit-agent-skills`
- 官方参考：`https://github.com/github/spec-kit`

## 安装 / 卸载

由仓库根目录的 `./scripts/install.sh` 统一管理（symlink skills/agents + 注入用户级 hooks）。详见仓库 README 的「快速开始」段。

## 验证

```bash
find plugins/speckit-expert/skills -name SKILL.md | wc -l
rg -n "^name: speckit-" plugins/speckit-expert/skills/*/SKILL.md
test -f plugins/speckit-expert/skills/speckit-baseline/templates/spec-template.md
test -f plugins/speckit-expert/skills/speckit-baseline/templates/plan-template.md
test -f plugins/speckit-expert/skills/speckit-baseline/templates/tasks-template.md
test -f plugins/speckit-expert/skills/speckit-baseline/scripts/check-prerequisites.mjs
test -f plugins/speckit-expert/skills/speckit-baseline/scripts/bootstrap-specify.mjs
node --test plugins/speckit-expert/tests/*.test.mjs
```
