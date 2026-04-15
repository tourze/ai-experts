# research-expert

深度研究专家插件，覆盖多轮 Web 研究、代码库知识挖掘、多源信息综合、技术资讯搜索与站点画像分析。

## Skills

| Skill | 用途 |
|-------|------|
| `deep-research` | 多轮迭代 Web 深度研究 |
| `web-content-fetcher` | URL 正文提取为 Markdown |
| `wiki-researcher` | 代码库主题迭代深度研究 |
| `knowledge-synthesis` | 多源搜索结果综合去重 |
| `technology-search` | 技术博客/论坛/媒体搜索 |
| `site-analyze` | 域名/IP 站点画像分析 |

## 结构

- `.claude-plugin/plugin.json`：插件清单，显式声明 `skills/`；标准 `hooks/hooks.json` 会由 Claude 自动加载。
- `hooks/`：`hooks.json` 与 `dispatch.mjs`
- `skills/`：研究类技能与配套脚本
- `tests/`：manifest、hooks、skills 结构自检

## 运行前提

- `node`：用于 hook 分发与 `technology-search`
- `python3`：用于 `site-analyze` 与 `web-content-fetcher`
- `requests`：`site-analyze` Python 依赖，见 `skills/site-analyze/requirements.txt`
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
