# youtube-expert

YouTube 专家插件，覆盖“视频发现”与“单视频分析”两条链路。

## 结构

- `.claude-plugin/plugin.json`：插件清单，显式声明 `skills/` 与 `hooks/hooks.json`
- `hooks/`：`hooks.json`、`dispatch.mjs` 与 `session-start/plugin-sanity.mjs`
- `skills/youtube-analysis/`：字幕抓取、Markdown 脚手架、分析模式参考
- `skills/youtube-search/`：YouTube 搜索封装脚本与搜索 skill 文档
- `tests/`：manifest、dispatch、脚本语法与 Python 运行时回归测试

## Skills

| Skill | 用途 |
|-------|------|
| `youtube-analysis` | 抓取单条 YouTube 视频字幕并生成结构化分析输入 |
| `youtube-search` | 搜索 YouTube 并输出结构化候选结果 |

## 运行依赖

- `python3`
- `node`
- `uv`（推荐，用于临时拉起 `yt-dlp` / `youtube-transcript-api`）

说明：

- `youtube-analysis` 需要 `youtube-transcript-api` 与 `yt-dlp`
- `youtube-search` 只需要 `yt-dlp`

## 安装

```bash
claude --plugin-dir /path/to/plugins/youtube-expert
```

## Hooks

- `SessionStart`：执行插件自检，确认 manifest、hooks、README、所有 `SKILL.md` 以及 skill 间交叉引用完整存在。
- 设计原则：只 `report` 不 `block`；即使 hook 自身异常，也不阻断插件加载。

## 验证

```bash
python3 -m json.tool plugins/youtube-expert/.claude-plugin/plugin.json >/dev/null
python3 -m json.tool plugins/youtube-expert/hooks/hooks.json >/dev/null
find plugins/youtube-expert -name '*.mjs' -print0 | xargs -0 -n1 node --check
find plugins/youtube-expert -name '*.py' -print0 | xargs -0 -n1 python3 -m py_compile
node --test plugins/youtube-expert/tests/*.test.mjs
python3 -m unittest discover -s plugins/youtube-expert/tests -p 'test_*.py'
```
