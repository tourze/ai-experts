# creative-expert

创意、可视化与游戏引擎专家能力，覆盖视觉设计、概念转图片/视频、文章配图、图片压缩、ASCII 图表、桌面截图，以及 Godot 4 GDScript 场景组织与模式。

## 目录结构

- `skills/`：创意、可视化与游戏引擎技能。
- `hooks/`：1 个 SessionStart 环境探测器（Godot 项目探测）。
- `tests/`：最小回归测试。

## Skills

| Skill | 用途 |
|-------|------|
| `algo-visualization` | 数据结构/算法的可交互单文件 HTML 教学页 |
| `canvas-design` | 视觉艺术设计（PNG/PDF 输出） |
| `concept-to-image` | 概念转静态 HTML 视觉稿再导出图片 |
| `concept-to-video` | 概念转 Manim 动画解释视频 |
| `baoyu-article-illustrator` | 文章结构分析 + 配图位置标注与生成 |
| `baoyu-compress-image` | 图片压缩为 WebP/PNG |
| `plantuml-ascii` | PlantUML ASCII 图表生成 |
| `screenshot` | 桌面/系统截图 |
| `ui-style-catalog` | UI 风格目录、CSS 特征与适用场景速查 |
| `godot-gdscript-patterns` | Godot 4 GDScript 场景组织、状态机、资源建模、对象池与组件化模式 |

## Agents

| Agent | 用途 |
|-------|------|
| `visual-producer` | produce visual assets by combining multiple creative skills — from concept design through image/video generation to compression and delivery |

## Hooks

- `SessionStart`：Godot 项目环境探测（`project.godot` 引擎版本、渲染器、脚本语言）。

## 验证命令

在当前目录执行：

```bash
find tests -type f -name '*.mjs' -print0 | xargs -0 -n1 node --check
find skills -type f -name '*.py' -print0 | xargs -0 -n1 python3 -m py_compile
node --test tests/*.test.mjs
```

## 安装 / 卸载

由仓库根目录的 `node scripts/install.mjs` 统一管理（symlink skills/agents + 注入用户级 hooks）。详见仓库 README 的「快速开始」段。
