# skill-expert

Skill 工程专家插件，覆盖 skill 发现、创建、质量评审和批量治理。插件内 skill 主要从 `/Users/air/work/ai-infra/skills` 复制，并保留所需的参考资料和辅助资源。

## 结构

- `hooks/`：7 个本地守卫（覆盖 SessionStart、UserPromptSubmit、Stop 三种事件）。
- `SessionStart`：注入 Skill 路由声明要求。
- `UserPromptSubmit`：每轮注入 Skill 路由提醒；当最近自动审计数据表明 skill 路由/使用或 hook telemetry 需要复盘时，额外提示优先使用 `trigger-telemetry-advisor`。
- `Stop`：若最终回复缺少“下一步推荐”区块，则阻断结束并要求补齐；同时自动记录每轮 skill 路由声明、已调用/未调用和下一步推荐，用于后续触发治理报告。
- `skills/`：7 个 skill 工程相关技能及其配套 `references/`、`agents/`、`assets/`。
- `tests/`：覆盖 hook 自检、工具语法与 skill 文档交叉引用。

## Skills

| Skill | 用途 |
|-------|------|
| `find-skills` | 发现可安装的外部 skill，并给出筛选与安装建议 |
| `skill-creator` | 创建或迭代 skill，并组织评测与对比流程 |
| `skill-evolver` | 对标两个 skill 的真实表现，提炼参考 skill 的可迁移模式并渐进注入目标 skill |
| `skill-evaluator` | 双模式 skill 质量评估：Mode A 8 维度设计评分 + Mode B 闭卷知识覆盖验证 |
| `skill-activation-analyzer` | 诊断 skill 触发行为：命中/漏触发/误触发/冲突检测/路由健康度评估 |
| `trigger-telemetry-advisor` | 根据当前会话或工作区的 hook/skill telemetry 生成触发治理建议报告 |
| `skills-prune-and-sync-readme` | 审计、清理 skill，并同步 `README.md` 的 skill 列表 |

## Agents

| Agent | 适用场景 | 预加载 skill |
|-------|----------|--------------|
| `skill-quality-auditor` | 只读审计仓库 skill 质量：设计评分、知识覆盖、CSO 触发风险、路由冲突、telemetry 噪音、库存治理 | skill-evaluator, skill-activation-analyzer, trigger-telemetry-advisor, skills-prune-and-sync-readme |
| `skill-author` | 创建 / 演化 / 发现 skill 的写入型编排，落盘 SKILL.md、references、evals 与 README 索引 | skill-creator, skill-evolver, find-skills, skill-evaluator, skill-activation-analyzer |

## 安装 / 卸载

由仓库根目录的 `node scripts/install.mjs` 统一管理（symlink skills/agents + 注入用户级 hooks）。详见仓库 README 的「快速开始」段。

## 验证

```bash
node --test plugins/skill-expert/tests/*.test.mjs
```
