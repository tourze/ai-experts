# creative-expert

创意与可视化专家插件，覆盖视觉设计、概念转图片/视频、文章配图、图片压缩、ASCII 图表和桌面截图。

## 目录结构

- `hooks/`：`hooks.json` 与 `dispatch.mjs`。
- `skills/`：创意与可视化技能包。
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
| `ui-style-catalog` | UI 风格目录、CSS 特征与适用场景速查 |

## Agents

| Agent | 用途 |
|-------|------|
| `visual-producer` | produce visual assets by combining multiple creative skills — from concept design through image/video generation to compression and delivery |

## 验证命令

在插件目录执行：

```bash
jq empty hooks/hooks.json
find hooks tests -type f -name '*.mjs' -print0 | xargs -0 -n1 node --check
find skills -type f -name '*.py' -print0 | xargs -0 -n1 python3 -m py_compile
find skills/screenshot/scripts -type f -name '*.swift' -print0 | xargs -0 -n1 swiftc -typecheck
node --test tests/*.test.mjs
node skills/baoyu-article-illustrator/scripts/build-batch.mjs --help
node skills/baoyu-compress-image/scripts/main.mjs --help
node skills/concept-to-image/scripts/render_to_image.mjs --help
node skills/concept-to-video/scripts/render_video.mjs --help
node skills/concept-to-video/scripts/add_audio.mjs --help
node skills/screenshot/scripts/take_screenshot.mjs --help
```

## 安装 / 卸载

由仓库根目录的 `./scripts/install.sh` 统一管理（symlink skills/agents + 注入用户级 hooks）。详见仓库 README 的「快速开始」段。

