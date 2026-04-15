# creative-expert

创意与可视化专家插件，覆盖视觉设计、概念转图片/视频、文章配图、图片压缩、ASCII 图表和桌面截图。

## 目录结构

- `.claude-plugin/plugin.json`：插件清单，显式注册 `skills/` 与 `hooks/hooks.json`。
- `hooks/`：`hooks.json` 与 `dispatch.mjs`。
- `skills/`：7 个创意与可视化技能包。
- `tests/`：`dispatch` 的最小回归测试。

## Skills

| Skill | 用途 |
|-------|------|
| `canvas-design` | 视觉艺术设计（PNG/PDF 输出） |
| `concept-to-image` | 概念转静态 HTML 视觉稿再导出图片 |
| `concept-to-video` | 概念转 Manim 动画解释视频 |
| `baoyu-article-illustrator` | 文章结构分析 + 配图位置标注与生成 |
| `baoyu-compress-image` | 图片压缩为 WebP/PNG |
| `plantuml-ascii` | PlantUML ASCII 图表生成 |
| `screenshot` | 桌面/系统截图 |

## 验证命令

在插件目录执行：

```bash
jq empty .claude-plugin/plugin.json
jq empty hooks/hooks.json
find hooks tests -type f -name '*.mjs' -print0 | xargs -0 -n1 node --check
find skills -type f -name '*.py' -print0 | xargs -0 -n1 python3 -m py_compile
find skills/screenshot/scripts -type f -name '*.swift' -print0 | xargs -0 -n1 swiftc -typecheck
node --test tests/*.test.mjs
npx -y tsx skills/baoyu-article-illustrator/scripts/build-batch.ts --help
npx -y tsx skills/baoyu-compress-image/scripts/main.ts --help
python3 skills/concept-to-image/scripts/render_to_image.py --help
python3 skills/concept-to-video/scripts/render_video.py --help
python3 skills/concept-to-video/scripts/add_audio.py --help
python3 skills/screenshot/scripts/take_screenshot.py --help
```

## 安装

```bash
claude --plugin-dir /path/to/plugins/creative-expert
```

如果要通过本仓库根目录注册的 `ai-experts` marketplace 持久安装：

```bash
claude plugin install creative-expert@ai-experts
claude plugin install creative-expert@ai-experts --scope project
```

## 卸载

```bash
claude plugin uninstall creative-expert
claude plugin uninstall creative-expert --scope project
```

如果只是通过 `claude --plugin-dir ...` 临时加载，则不需要执行卸载；结束当前会话或下次启动时去掉 `--plugin-dir` 即可。
