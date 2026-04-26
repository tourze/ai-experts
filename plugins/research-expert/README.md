# research-expert

深度研究专家插件，覆盖多轮 Web 研究、代码库知识挖掘、多源信息综合、技术资讯搜索与站点画像分析。

## Skills

| Skill | 用途 |
|-------|------|
| `citation-validator` | 研究报告引用完整性与 A-E 来源质量验证 |
| `comparative-analysis` | 多对象结构化对比分析 |
| `deep-code-read` | 深度理解代码库并生成认知型 skill 文件；ABC 闭卷考试循环验证 |
| `deep-research` | 多轮迭代 Web 深度研究 + chain-of-verification |
| `knowledge-synthesis` | 多源搜索结果综合去重 + A-E 来源分层 |
| `question-refiner` | 研究问题 5 维澄清与结构化 prompt 生成 |
| `repo-analyzer` | 外部仓库克隆与结构化分析 |
| `site-analyze` | 域名/IP 站点画像分析 |
| `technology-search` | 技术博客/论坛/媒体搜索 |
| `web-content-fetcher` | URL 正文提取为 Markdown |
| `wiki-researcher` | 代码库主题迭代深度研究 |

## Agents

| Agent | 用途 |
|-------|------|
| `deep-researcher` | 自主多轮研究：Web 搜索、页面抓取、仓库分析与知识综合 |

## 结构

- `.claude-plugin/plugin.json`：插件清单，显式声明 `skills/`；标准 `hooks/hooks.json` 会由 Claude 自动加载。
- `agents/`：自主研究 agent 定义
- `hooks/`：`hooks.json` 与 `dispatch.mjs`
- `skills/`：研究类技能与配套脚本
- `tests/`：manifest、hooks、skills 结构自检

## 运行前提

- `node`：用于 hook 分发、`technology-search` 与 `site-analyze`
- `python3`：用于 `web-content-fetcher`
- `scrapling`、`html2text`：`web-content-fetcher` 依赖，见 `skills/web-content-fetcher/requirements.txt`
- `dig`、`whois`、`traceroute`、`ping`：`site-analyze` 外部命令依赖

## 验证

```bash
jq empty plugins/research-expert/.claude-plugin/plugin.json
jq empty plugins/research-expert/hooks/hooks.json
node --check plugins/research-expert/hooks/dispatch.mjs
node --test plugins/research-expert/tests/*.mjs
```

## 安装

```bash
claude --plugin-dir /path/to/plugins/research-expert
```

如果要通过本仓库根目录注册的 `ai-experts` marketplace 持久安装：

```bash
claude plugin install research-expert@ai-experts
claude plugin install research-expert@ai-experts --scope project
```

## 卸载

```bash
claude plugin uninstall research-expert
claude plugin uninstall research-expert --scope project
```

如果只是通过 `claude --plugin-dir ...` 临时加载，则不需要执行卸载；结束当前会话或下次启动时去掉 `--plugin-dir` 即可。
