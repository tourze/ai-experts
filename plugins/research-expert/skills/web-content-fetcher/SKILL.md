---
name: web-content-fetcher
description: 当用户给出具体 URL，需要抓取网页正文并转成 Markdown 时使用。适用于博客、文档、新闻页和微信公众号等页面的正文提取与内容准备。
---

# 网页正文提取

## 适用场景

- 用户直接给出 URL，让你“读一下 / 抓一下 / 提取正文 / 总结这篇文章”。
- 需要把页面内容转成 Markdown，再交给其他流程处理。
- 常作为 [deep-research](../deep-research/SKILL.md) 的正文抓取阶段。
- 如果只是做技术资讯聚合而不是抓单页正文，转到 [technology-search](../technology-search/SKILL.md)。

## 核心约束

- 主脚本是 [`scripts/fetch.py`](scripts/fetch.py)，依赖见 [`requirements.txt`](requirements.txt)。
- 每个 URL 先选一种模式执行，不要无脑循环重试。
- `--stealth` 用于已知 JS 渲染或反爬更重的页面，例如微信公众号、知乎专栏、掘金。
- 默认 fast 模式会在内容过短时自动回退到 stealth，因此大多数站点无需手动指定 `--stealth`。
- 如果脚本失败，可以再考虑其他非脚本方案；不要把多次失败的同一 URL 反复塞进上下文。

## 代码模式

```bash
# <skill_dir> 为当前 SKILL.md 所在目录
python3 "<skill_dir>/scripts/fetch.py" "https://sspai.com/post/73145"

# 对已知需要浏览器渲染的站点直接强制 stealth
python3 "<skill_dir>/scripts/fetch.py" "https://mp.weixin.qq.com/s/xxx" --stealth

# 限制最大输出字符数
python3 "<skill_dir>/scripts/fetch.py" "https://example.com/article" 15000

# JSON 输出（包含 mode、selector、content_length）
python3 "<skill_dir>/scripts/fetch.py" "https://example.com/article" --json
```

```text
域名路由建议
- mp.weixin.qq.com → 直接用 --stealth
- zhuanlan.zhihu.com → 直接用 --stealth
- juejin.cn → 直接用 --stealth
- sspai.com / blog.csdn.net / openai.com / blog.google → 先用默认模式
```

## 检查清单

- 依赖是否已安装：`pip install -r <skill_dir>/requirements.txt`。
- 是否根据域名选择了合适模式，而不是所有站点都强制 stealth。
- 是否优先读取 JSON/Markdown 正文，而不是直接拿错误日志当内容。
- 对提取失败的 URL，是否及时停止重试并回到上层研究流程。
- 图片懒加载站点的正文里，图片链接是否被正确替换到 Markdown。

## 反模式

### FAIL: 无脑重试同 URL

```bash
python3 scripts/fetch.py "https://..." # 失败
python3 scripts/fetch.py "https://..." # 又失败
python3 scripts/fetch.py "https://..." # 还失败
→ 上下文浪费 / 用户时间浪费
```

### PASS: 失败 2 次即停

```bash
python3 scripts/fetch.py "$url" || python3 scripts/fetch.py "$url" --stealth
# 两次失败：
# - 告诉用户 URL 暂不可抓
# - 提出替代：人工复制 / 换备份 URL
# 不继续重试
```

### FAIL: 已知站点不加 --stealth

```bash
python3 scripts/fetch.py "https://mp.weixin.qq.com/s/..."
# 默认 fast 模式 → 微信公众号强反爬 → 拿到空页
```

### PASS: 域名路由

```bash
# mp.weixin.qq.com / zhuanlan.zhihu.com / juejin.cn
python3 scripts/fetch.py "$url" --stealth
```
