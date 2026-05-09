# Web Content Fetcher

当前目录内的网页正文提取工具，负责把单个 URL 转成干净 Markdown。

## 依赖

需要本地有可用 `node`。脚本只使用 Node.js 内置 API，不需要安装 Python 包。

## 调用方式

```bash
# 默认 fast，内容过短时自动回退到 stealth
node <runtime-root>/procedures.js --procedure-id web-content-fetcher-fetch --trigger-skill web-content-fetcher -- https://sspai.com/post/73145

# 对请求头更敏感的站点可先强制 stealth
node <runtime-root>/procedures.js --procedure-id web-content-fetcher-fetch --trigger-skill web-content-fetcher -- https://mp.weixin.qq.com/s/xxx --stealth

# 控制输出长度
node <runtime-root>/procedures.js --procedure-id web-content-fetcher-fetch --trigger-skill web-content-fetcher -- https://example.com/article 15000

# 结构化 JSON 输出
node <runtime-root>/procedures.js --procedure-id web-content-fetcher-fetch --trigger-skill web-content-fetcher -- https://example.com/article --json
```

## 路由建议

| 域名 | 建议模式 | 说明 |
|------|----------|------|
| `mp.weixin.qq.com` | `--stealth` | 使用浏览器式请求头；强 JS 页面需换浏览器方案 |
| `zhuanlan.zhihu.com` | `--stealth` | 使用浏览器式请求头；强 JS 页面需换浏览器方案 |
| `juejin.cn` | `--stealth` | SPA 页面可能需要浏览器方案 |
| `sspai.com` | 默认 | 静态内容即可 |
| `blog.csdn.net` | 默认 | 静态内容即可 |
| 其他 | 默认 | 先 fast，必要时自动回退 |

## 输出

- Markdown：正文、标题、链接、图片、列表、代码块
- JSON：`url`、`mode`、`selector`、`content_length`、`content`

## 说明

- 本 README 只描述网页正文提取入口的基础用法；构建后命令会映射为平台级 `procedures.js` 调用。
- 更完整的 agent 调用规范见 [`SKILL.md`](SKILL.md)。
