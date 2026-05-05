## 代码模式

### 1. 先产出设计哲学

设计哲学文件建议包含：

- 运动/流派名称
- 4-6 段审美阐述
- 对空间、色彩、节奏、材质、排版的约束
- 对“工艺感”和“完成度”的明确要求

示例输出：

```text
outputs/
├── philosophy.md
└── poster.png
```

### 2. 再表达为单页成品

成品阶段要明确：

- 画布尺寸与边距
- 主视觉元素与次级视觉元素
- 字体组合与字号层级
- 是否导出为 `.png`、`.pdf` 或两者都导出

### 3. 使用字体目录

可直接从 `canvas-fonts/` 选字族，例如：

- `InstrumentSans-*`：干净、现代、偏编辑感
- `IBMPlexSerif-*`：理性、文献感
- `JetBrainsMono-*` / `GeistMono-*`：技术、编码感
- `BigShoulders-*` / `Tektur-*`：展示型标题

## 自动化工具

- `node scripts/baoyu-article-illustrator-build-batch.mjs` — 批量图像生成任务构建
- `node scripts/concept-to-image-render_to_image.mjs` — HTML/CSS 概念稿渲染为 PNG（Playwright）
- `node scripts/concept-to-video-render_video.mjs` — 帧序列渲染为视频（ffmpeg）
- `node scripts/concept-to-video-add_audio.mjs` — 为视频添加音频轨道（ffmpeg）
