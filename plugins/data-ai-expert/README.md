# data-ai-expert

数据与 AI 专家插件，聚焦 14 个技能：结构化数据分析、统计推断、图表表达、图表选型、数据叙事、Embedding/RAG/向量检索优化、Prompt 工程、LLM 评估，以及 Model-First 推理。

## 目录结构

- `.claude-plugin/plugin.json`：插件清单，显式声明 `skills/`；标准 `hooks/hooks.json` 会由 Claude 自动加载。
- `hooks/`：`hooks.json` 与 `dispatch.mjs`。
- `skills/`：14 个领域技能及其脚本、参考资料、评测样例
- `tests/`：manifest、dispatch、README/skill 结构一致性检查

## Skills

| Skill | 用途 |
|-------|------|
| `data-analysis` | 本地 `.xlsx` / `.csv` 数据分析、SQL 查询、结果导出 |
| `data-storytelling` | 将分析结论组织为对业务方友好的叙事结构 |
| `data-visualization` | 选择合适图表并输出可靠的可视化代码模式 |
| `embedding-strategies` | Embedding 模型、切块与质量评估策略 |
| `llm-evaluation` | LLM 应用评估、回归对比与指标设计 |
| `model-first-reasoning` | 先建模后实现的形式化推理流程 |
| `narrative-text-visualization` | 使用 T8 语法输出结构化叙事文本可视化 |
| `prompt-engineering-patterns` | Prompt 模板、结构化输出、稳健约束模式 |
| `prompt-lab` | Prompt 诊断、变体设计、评分标准与测试集构造 |
| `rag-auditor` | RAG 检索链路与生成链路的系统审计 |
| `similarity-search-patterns` | 语义检索与向量数据库实现模式 |
| `statistical-analysis` | 描述统计、异常检测、假设检验与解释边界 |
| `vector-index-tuning` | HNSW/量化/召回-延迟-内存权衡调优 |

## Agents

| Agent | 用途 |
|-------|------|
| `data-analyst` | explore datasets, perform statistical analysis, generate visualizations, and evaluate model performance |

## 安装

```bash
claude --plugin-dir /absolute/path/to/plugins/data-ai-expert
```

如果要通过本仓库根目录注册的 `ai-experts` marketplace 持久安装：

```bash
claude plugin install data-ai-expert@ai-experts
claude plugin install data-ai-expert@ai-experts --scope project
```

## 卸载

```bash
claude plugin uninstall data-ai-expert
claude plugin uninstall data-ai-expert --scope project
```

如果只是通过 `claude --plugin-dir ...` 临时加载，则不需要执行卸载；结束当前会话或下次启动时去掉 `--plugin-dir` 即可。

## 校验

```bash
python3 -m json.tool plugins/data-ai-expert/.claude-plugin/plugin.json >/dev/null
python3 -m json.tool plugins/data-ai-expert/hooks/hooks.json >/dev/null
node --check plugins/data-ai-expert/hooks/dispatch.mjs
node --check plugins/data-ai-expert/skills/model-first-reasoning/scripts/validate-model.mjs
node --check plugins/data-ai-expert/skills/prompt-engineering-patterns/scripts/optimize-prompt.mjs
node --check plugins/data-ai-expert/skills/data-analysis/scripts/analyze.mjs
node --test plugins/data-ai-expert/tests/*.test.mjs
```
