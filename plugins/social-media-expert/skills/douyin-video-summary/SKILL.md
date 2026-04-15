---
name: douyin-video-summary
description: 当用户提供抖音链接并需要提取音频、转录中文内容或同步到飞书文档时使用。
---

# 抖音视频摘要

## 适用场景

- 用户贴出抖音短链或直链，希望快速拿到文字摘要。
- 用户需要把抖音视频内容转成可编辑文本，再继续做复盘、改写或知识整理。
- 用户已经拿到音频直链，想直接跑本地转录流程。
- 需要把摘要同步到飞书文档时，配合 [飞书同步说明](references/feishu-sync.md) 一起用。
- 需要进一步把视频内容改写成文案时，切到 [douyin-viral-content](../douyin-viral-content/SKILL.md)。

## 核心约束

- 不要承诺“直接下载抖音音频”；短链通常只能先解析视频 ID，再通过浏览器拦截音频请求。
- 没拿到音频直链之前，不要伪造下载步骤，也不要推荐已知会被 403 的无头方案。
- 所有命令示例都基于本地工具：`curl`、`ffmpeg`、`ffprobe`、`whisper-cli`。
- 先确认模型文件存在，再执行转录；缺模型时只给安装步骤，不要假装已经完成转录。
- 输出摘要时保留“事实”和“观点”分层，避免把推测写成原视频原话。

## 代码模式

解析短链并提取视频 ID：

```bash
curl -sL -o /dev/null -w '%{url_effective}' 'https://v.douyin.com/xxxxx/' \
  | grep -oE '[0-9]{15,}'
```

用浏览器拿到音频直链后，下载音频：

```bash
bash scripts/download_audio.sh "<audio_url>" ./audio.mp4
```

转录音频：

```bash
bash scripts/transcribe.sh ./audio.mp4 ./output models/ggml-small.bin zh
```

标准摘要模板：

```markdown
📹 标题：<视频标题>
👤 作者：<作者名>
⏱ 时长：<时长>

## 核心结论
- 结论 1
- 结论 2

## 关键细节
1. 细节 1
2. 细节 2

## 一句话总结
<20-40 字总结>
```

## 检查清单

- 已确认输入是抖音分享链接或视频直链。
- 已说明“音频直链通常需要浏览器拦截”。
- [`scripts/download_audio.sh`](scripts/download_audio.sh) 与 [`scripts/transcribe.sh`](scripts/transcribe.sh) 的参数顺序保持一致。
- 转录前已确认 `ffmpeg`、`ffprobe`、`whisper-cli` 和模型文件可用。
- 摘要中区分了“视频明确说了什么”和“基于内容的整理归纳”。
- 需要飞书落库时，已对照 [飞书同步说明](references/feishu-sync.md)。

## 反模式

- 把 `yt-dlp`、`aria2c` 403 失败链路当成默认方案。
- 没拿到音频就直接承诺“已经完成转录”。
- 将摘要写成营销话术，丢失原视频结构。
- 生成大段逐字稿却不提炼重点，导致用户还得再清洗一遍。
- 遇到工具缺失时静默失败，不给出缺少的命令或模型路径。
