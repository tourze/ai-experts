# speckit-expert

Spec Kit 工作流专家插件，覆盖需求规格化、澄清、技术规划、任务拆解、实现执行与一致性分析。

## 目录结构

- `.claude-plugin/plugin.json`：Claude 插件清单
- `.codex-plugin/plugin.json`：Codex 插件清单
- `skills/`：17 个 `speckit-*` 中文技能
- `templates/`：内置 Spec Kit 中文模板（spec/plan/tasks/checklist/constitution）
- `scripts/`：内置 Node.js 脚本（`bootstrap-specify.mjs`、`check-prerequisites.mjs`、`setup-plan.mjs` 等）

## 工作流策略

- 默认在**当前分支**工作，不自动创建新分支。
- `speckit-specify` / `speckit-baseline` 会把当前 feature 写入 `.specify/feature.json`，供后续脚本定位目录。
- 若没有 `.specify/feature.json` 或 `SPECIFY_FEATURE_DIRECTORY`，脚本不会在普通分支上猜测 `specs/<branch>`；只兼容明确的 legacy feature 分支名。
- 仅当用户明确要求时才切换到“按分支驱动”的流程。

## 初始化（首次使用）

```bash
node plugins/speckit-expert/scripts/bootstrap-specify.mjs
```

该命令会按脚本自身位置定位插件资源，并把内置 `scripts` 与 `templates` 同步到项目 `.specify/`。

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

## 参考来源

- 社区参考：`https://github.com/dceoy/speckit-agent-skills`
- 官方参考：`https://github.com/github/spec-kit`

## 安装

```bash
claude --plugin-dir /path/to/plugins/speckit-expert
```

如果要通过本仓库根目录注册的 `ai-experts` marketplace 持久安装：

```bash
claude plugin install speckit-expert@ai-experts
claude plugin install speckit-expert@ai-experts --scope project
```

## 卸载

```bash
claude plugin uninstall speckit-expert
claude plugin uninstall speckit-expert --scope project
```

如果只是通过 `claude --plugin-dir ...` 临时加载，则不需要执行卸载；结束当前会话或下次启动时去掉 `--plugin-dir` 即可。

## 验证

```bash
jq empty plugins/speckit-expert/.claude-plugin/plugin.json
jq empty plugins/speckit-expert/.codex-plugin/plugin.json
find plugins/speckit-expert/skills -name SKILL.md | wc -l
rg -n "^name: speckit-" plugins/speckit-expert/skills/*/SKILL.md
test -f plugins/speckit-expert/templates/spec-template.md
test -f plugins/speckit-expert/templates/plan-template.md
test -f plugins/speckit-expert/templates/tasks-template.md
test -f plugins/speckit-expert/scripts/check-prerequisites.mjs
test -f plugins/speckit-expert/scripts/bootstrap-specify.mjs
node --test plugins/speckit-expert/tests/*.test.mjs
```
