# data-ai-expert

数据与 AI 专家插件，聚焦 14 个技能：结构化数据分析、统计推断、图表表达、图表选型、数据叙事、Embedding/RAG/向量检索优化、Prompt 工程、LLM 评估，以及 Model-First 推理。

## 目录结构

- `skills/`：14 个领域技能及其脚本、参考资料、评测样例
- `tests/`：README/skill 结构一致性检查
- `.mcp.json`：智谱 Z.AI MCP 声明，由仓库根安装脚本统一同步

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
| `ai-app-engineer` | LLM 应用设计 / 审查 / 优化：prompt 工程、检索增强、向量索引、embedding 选型与离线 eval |

## 安装 / 卸载

由仓库根目录的 `node scripts/install.mjs` 统一管理（symlink skills/agents + 注入用户级 hooks）。详见仓库 README 的「快速开始」段。

安装脚本会读取仓库根 `.env.local`。配置 `Z_AI_API_KEY` 后，会同步本插件 `.mcp.json` 中声明的 `zai-mcp-server`、`web-search-prime`、`web-reader` 与 `zread`；Claude Code 直连远程 HTTP MCP，Codex CLI 通过 `uvx mcp-proxy` 兼容访问远程 HTTP MCP。未配置时会移除这些托管 MCP 条目并保留用户自定义 MCP。

## 校验

```bash
node --check plugins/data-ai-expert/skills/model-first-reasoning/scripts/validate-model.mjs
node --check plugins/data-ai-expert/skills/prompt-engineering-patterns/scripts/optimize-prompt.mjs
node --check plugins/data-ai-expert/skills/data-analysis/scripts/analyze.mjs
node --test plugins/data-ai-expert/tests/*.test.mjs
```
