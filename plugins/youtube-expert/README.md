# youtube-expert

YouTube 专家插件，覆盖“视频发现”与“单视频分析”两条链路。

## 结构

- `.claude-plugin/plugin.json`：插件清单，显式声明 `skills/`；标准 `hooks/hooks.json` 会由 Claude 自动加载。
- `hooks/`：`hooks.json` 与 `dispatch.mjs`
- `skills/youtube-analysis/`：字幕抓取、Markdown 脚手架、分析模式参考
- `skills/youtube-search/`：YouTube 搜索封装脚本与搜索 skill 文档
- `tests/`：manifest、dispatch、脚本语法与 Node 运行时回归测试

## Skills

| Skill | 用途 |
|-------|------|
| `youtube-analysis` | 抓取单条 YouTube 视频字幕并生成结构化分析输入 |
| `youtube-search` | 搜索 YouTube 并输出结构化候选结果 |

## 运行依赖

- `node`
- `yt-dlp`

说明：

- `youtube-analysis` 需要 `yt-dlp`
- `youtube-search` 只需要 `yt-dlp`

## 安装

```bash
claude --plugin-dir /path/to/plugins/youtube-expert
```

如果要通过本仓库根目录注册的 `ai-experts` marketplace 持久安装：

```bash
claude plugin install youtube-expert@ai-experts
claude plugin install youtube-expert@ai-experts --scope project
```

## 卸载

```bash
claude plugin uninstall youtube-expert
claude plugin uninstall youtube-expert --scope project
```

如果只是通过 `claude --plugin-dir ...` 临时加载，则不需要执行卸载；结束当前会话或下次启动时去掉 `--plugin-dir` 即可。

## 验证

```bash
find plugins/youtube-expert -name '*.mjs' -print0 | xargs -0 -n1 node --check
node --test plugins/youtube-expert/tests/*.mjs
```
