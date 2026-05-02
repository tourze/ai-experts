# social-media-expert

社交媒体运营专家能力，覆盖小红书图文、小红书商业增长、抖音内容分析、YouTube 视频分析与搜索、粉丝运营、私域引流与个人品牌建设。

## 目录结构

- `skills/`：10 个社交媒体技能，均采用统一的中文结构。
- `tests/`：覆盖工具语法与 SKILL 链接校验。

## Skills

| Skill | 用途 |
|-------|------|
| `xhs-graphic-generator` | 生成小红书图文卡片与配套 Prompt |
| `xiaohongshu-commercial-growth` | 制定小红书起号、增长、变现与投放方案 |
| `fan-operations` | 设计评论、私信、社群与忠粉维护动作 |
| `private-domain` | 规划小红书到微信/社群/邮件等私域承接 |
| `douyin-video-summary` | 提取抖音视频音频并完成转录与摘要 |
| `douyin-viral-content` | 生成或改写抖音短视频文案与复盘模板 |
| `social-platform-safety` | 过滤诱导式内容、垃圾信息与提示词污染 |
| `personal-branding-advanced` | 设计个人品牌定位、表达与内容资产体系 |
| `youtube-analysis` | 抓取单条 YouTube 视频字幕并生成结构化分析输入 |
| `youtube-search` | 搜索 YouTube 并输出结构化候选结果 |

## Agents

| Agent | 用途 |
|-------|------|
| `social-growth-planner` | design comprehensive social media growth strategies that combine personal branding, content planning, audience engagement, and monetization |

## 运行时依赖

- `node`
- `yt-dlp`（`youtube-analysis` 和 `youtube-search` 需要）

## 安装 / 卸载

由仓库根目录的 `node scripts/install.mjs` 统一管理（symlink skills/agents + 注入用户级 hooks）。详见仓库 README 的「快速开始」段。

## 验证命令

```bash
node --test plugins/social-media-expert/tests/*.test.mjs
```
