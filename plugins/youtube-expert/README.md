# youtube-expert

YouTube 专家能力，覆盖“视频发现”与“单视频分析”两条链路。

## 结构

- `skills/youtube-analysis/`：字幕抓取、Markdown 脚手架、分析模式参考
- `skills/youtube-search/`：YouTube 搜索封装能力与搜索 skill 文档
- `tests/`：工具语法与 Node 运行时回归测试

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

## 安装 / 卸载

由仓库根目录的 `node scripts/install.mjs` 统一管理（symlink skills/agents + 注入用户级 hooks）。详见仓库 README 的「快速开始」段。

## 验证

```bash
find plugins/youtube-expert -name '*.mjs' -print0 | xargs -0 -n1 node --check
node --test plugins/youtube-expert/tests/*.mjs
```
