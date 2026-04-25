# social-media-expert

社交媒体运营专家插件，覆盖小红书图文、小红书商业增长、抖音内容分析、粉丝运营、私域引流与个人品牌建设。当前版本补齐了插件级 hook 入口、脚本语法校验和 SKILL 文档统一规范。

## 目录结构

- `.claude-plugin/plugin.json`：插件清单，显式声明 `skills/`；标准 `hooks/hooks.json` 会由 Claude 自动加载。
- `hooks/`：`hooks.json` 与 `dispatch.mjs`。
- `skills/`：8 个社交媒体技能，均采用统一的中文结构。
- `tests/`：覆盖 `dispatch`、脚本语法与 SKILL 链接校验。

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

## Agents

| Agent | 用途 |
|-------|------|
| `social-growth-planner` | design comprehensive social media growth strategies that combine personal branding, content planning, audience engagement, and monetization |

## 安装

```bash
claude --plugin-dir /path/to/plugins/social-media-expert
```

如果要通过本仓库根目录注册的 `ai-experts` marketplace 持久安装：

```bash
claude plugin install social-media-expert@ai-experts
claude plugin install social-media-expert@ai-experts --scope project
```

## 卸载

```bash
claude plugin uninstall social-media-expert
claude plugin uninstall social-media-expert --scope project
```

如果只是通过 `claude --plugin-dir ...` 临时加载，则不需要执行卸载；结束当前会话或下次启动时去掉 `--plugin-dir` 即可。

## 验证命令

```bash
jq empty plugins/social-media-expert/.claude-plugin/plugin.json
jq empty plugins/social-media-expert/hooks/hooks.json
node --check plugins/social-media-expert/hooks/dispatch.mjs
node --check plugins/social-media-expert/skills/douyin-video-summary/scripts/download_audio.mjs
node --check plugins/social-media-expert/skills/douyin-video-summary/scripts/transcribe.mjs
node --check plugins/social-media-expert/skills/xhs-graphic-generator/scripts/generate.mjs
node --check plugins/social-media-expert/skills/social-platform-safety/scripts/content_filter.mjs
node --test plugins/social-media-expert/tests/*.test.mjs
```
