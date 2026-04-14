# Web Content Fetcher

当前插件内的网页正文提取工具，负责把单个 URL 转成干净 Markdown。

## 依赖

```bash
pip install -r requirements.txt
```

## 调用方式

```bash
# 默认 fast，内容过短时自动回退到 stealth
python3 scripts/fetch.py "https://sspai.com/post/73145"

# 微信公众号 / 知乎专栏 / 掘金建议直接强制 stealth
python3 scripts/fetch.py "https://mp.weixin.qq.com/s/xxx" --stealth

# 控制输出长度
python3 scripts/fetch.py "https://example.com/article" 15000

# 结构化 JSON 输出
python3 scripts/fetch.py "https://example.com/article" --json
```

## 路由建议

| 域名 | 建议模式 | 说明 |
|------|----------|------|
| `mp.weixin.qq.com` | `--stealth` | JS 渲染 + 反爬 |
| `zhuanlan.zhihu.com` | `--stealth` | JS 渲染 + 反爬 |
| `juejin.cn` | `--stealth` | SPA 页面 |
| `sspai.com` | 默认 | 静态内容即可 |
| `blog.csdn.net` | 默认 | 静态内容即可 |
| 其他 | 默认 | 先 fast，必要时自动回退 |

## 输出

- Markdown：正文、标题、链接、图片、列表、代码块
- JSON：`url`、`mode`、`selector`、`content_length`、`content`

## 说明

- 本 README 只描述插件内脚本的本地用法。
- 更完整的 agent 调用规范见 [`SKILL.md`](SKILL.md)。
