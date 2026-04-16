---
name: concept-to-video
description: 当用户要把概念做成动画、制作解释型视频或用 Manim 做流程动画时使用；如果只要静态图，改用 concept-to-image。
---

# 概念转视频

## 适用场景

- 需要讲清流程、架构、算法、时间线、对比关系。
- 用户要的是可迭代的动画场景文件，而不是一次性视频成品。
- 需要先低清预览，再高质量导出。
- 如果只要静态图，改用 [concept-to-image](../concept-to-image/SKILL.md)。

## 核心约束

- 中间产物是 Python 场景文件，不是直接生成成片。
- 默认优先单文件、单 `Scene` 类；多章节场景是例外，不是默认。
- 输出格式只支持 `mp4`、`gif`、`webm`；不要再承诺 `png` 视频导出。
- 音频是后处理步骤，必须在视频渲染完成后再叠加。
- 依赖 `manim`、`ffmpeg`、`ffprobe`；缺任一关键依赖先补环境。
- 数学排版优先用 `Text` + Unicode；只有在确实需要时才引入 `MathTex` 与 LaTeX。

## 代码模式

### 1. 先选规则或模板

优先阅读：

- `references/rules/*.md`
- `references/templates/data_flow_template.py`
- `references/templates/comparison_template.py`
- `references/templates/timeline_template.py`

### 2. 低清预览

```bash
python3 scripts/render_video.py scene.py ConceptScene --quality low --format mp4
```

### 3. 最终导出

```bash
python3 scripts/render_video.py scene.py ConceptScene --quality high --format webm
```

### 4. 叠加音频

```bash
python3 scripts/add_audio.py final.mp4 voiceover.mp3 \
  --output final-with-audio.mp4 \
  --volume 1.0 \
  --fade-in 0.5 \
  --fade-out 1.5 \
  --trim-to-video
```

当前脚本约束：

- `scripts/render_video.py` 会校验 `--output` 后缀是否与 `--format` 一致。
- `scripts/add_audio.py` 的淡出时间会按最终输出时长计算，不会再从 `0` 秒开始错误淡出。

## 检查清单

- 已选择合适的规则文件或模板，而不是从空白场景胡写。
- 先跑了 `low` 或 `medium` 预览，再做 `high` 最终导出。
- 场景对象没有超出 Manim 安全边界。
- 输出格式与文件后缀一致。
- 音频淡入淡出和最终时长匹配。

## 反模式

### FAIL: 跳过 low 直接 high

```bash
python3 scripts/render_video.py scene.py --quality high
# 30 分钟渲染 → 发现节奏问题 → 重渲 30 分钟
```

### PASS: low → 检查 → high

```bash
# 1. low 预览（30 秒）
python3 scripts/render_video.py scene.py --quality low
# 2. 看效果，调节奏 / 元素位置
# 3. 再 high 渲染（30 分钟一次过）
```

### FAIL: 字幕代替动画

```python
class Scene1(Scene):
    def construct(self):
        self.add(Text("第一步：检查输入。第二步：处理。第三步：输出。", font_size=24))
        self.wait(5)
# 屏幕上一大段字 / 没有动画 / 视频形式无意义
```

### PASS: 节奏 + 层级

```python
class Scene1(Scene):
    def construct(self):
        step1 = Text("检查输入", font_size=48).to_edge(UP)
        self.play(Write(step1))
        diagram = create_input_diagram()
        self.play(FadeIn(diagram))
        self.wait(1)
        # 元素逐个出现，每步 1-2 秒
```
