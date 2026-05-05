# data-ai-expert

数据与 AI 专家能力，聚焦 12 个技能：结构化数据分析、统计推断、图表表达、图表选型、数据叙事、Embedding/RAG/向量检索优化、Prompt 工程、LLM 评估，以及 Model-First 推理。

## 目录结构

- `skills/`：14 个领域技能及其参考资料、评测样例
- `tests/`：README/skill 结构一致性检查
- `.mcp.json`：智谱 Z.AI MCP 声明，由仓库根安装脚本统一同步

## Skills

| Skill | 用途 |
|-------|------|
| `data-analysis` | 本地 `.xlsx` / `.csv` 数据分析、SQL 查询、结果导出 |
| `data-storytelling` | 将分析结论组织为对业务方友好的叙事结构 |
| `data-visualization` | 选择合适图表并输出可靠的可视化代码模式 |
| `embedding-strategies` | Embedding 模型、切块与质量评估策略 |
| `llm-app-design-pipeline` | 当需要设计或优化基于 LLM 的应用时使用；提供从应用形态确认、逐段优化到 eval 验证的完整设计 pipeline。 |
| `llm-app-diagnosis-framework` | 当需要系统化诊断 LLM 应用问题（幻觉/检索失配/指令对抗/token 超限/过度引用）、区分 model-first 与 prompt-first 适用边界、或建立 eval-first 改进闭环时使用。 |
| `llm-evaluation` | LLM 应用评估、回归对比与指标设计 |
| `model-first-reasoning` | 先建模后实现的形式化推理流程 |
| `prompt-engineering-patterns` | Prompt 模板、结构化输出、稳健约束、系统化诊断与变体实验 |
| `rag-auditor` | RAG 检索链路与生成链路的系统审计 |
| `similarity-search-patterns` | 语义检索与向量数据库实现模式 |
| `statistical-analysis` | 描述统计、异常检测、假设检验与解释边界 |
| `vector-index-tuning` | HNSW/量化/召回-延迟-内存权衡调优 |

## Agents

| Agent | 用途 |
|-------|------|
| `ai-app-engineer` | LLM 应用设计 / 审查 / 优化：prompt 工程、检索增强、向量索引、embedding 选型与离线 eval |
| `data-analyst` | explore datasets, perform statistical analysis, generate visualizations, and evaluate model performance |

## 安装 / 卸载

由仓库根目录的 `node scripts/install.mjs` 统一管理（symlink skills/agents + 注入用户级 hooks）。详见仓库 README 的「快速开始」段。

安装脚本会读取仓库根 `.env.local`。配置 `Z_AI_API_KEY` 后，会同步本目录 `.mcp.json` 中声明的 `zai-mcp-server`、`web-search-prime`、`web-reader` 与 `zread`；Claude Code 直连远程 HTTP MCP，Codex CLI 通过 `uvx mcp-proxy` 兼容访问远程 HTTP MCP。未配置时会移除这些托管 MCP 条目并保留用户自定义 MCP。

## 校验

```bash
node --test plugins/data-ai-expert/tests/*.test.mjs
```
