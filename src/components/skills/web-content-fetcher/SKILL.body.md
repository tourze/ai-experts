## 适用场景

- 用户直接给出 URL，让你“读一下 / 抓一下 / 提取正文 / 总结这篇文章”。
- 需要把页面内容转成 Markdown，再交给其他流程处理。
- 常作为 [deep-research](../deep-research/SKILL.md) 的正文抓取阶段。在深度研究流水线中，可先用 [references/question-refiner.md](references/question-refiner.md) 完善问题后再抓取。
- 如果只是做技术资讯聚合而不是抓单页正文，参考资讯聚合相关方法。

## 核心约束

- 主脚本是 [`scripts/fetch.mjs`](scripts/fetch.mjs)，使用 Node.js 内置 `fetch`，不依赖 Python 包。
- 每个 URL 先选一种模式执行，不要无脑循环重试。
- `--stealth` 使用更接近浏览器的请求头，但不执行 JavaScript；遇到强 JS 渲染页面时应及时切换到浏览器或其他抓取方案。
- 默认 fast 模式会在内容过短时自动用 browser-header 模式重试，因此大多数静态站点无需手动指定 `--stealth`。
- 如果脚本失败，可以再考虑其他非脚本方案；不要把多次失败的同一 URL 反复塞进上下文。

## 代码模式

```bash
node scripts/fetch.mjs "https://sspai.com/post/73145"

# 对请求头更敏感的站点可先强制 stealth
node scripts/fetch.mjs "https://mp.weixin.qq.com/s/xxx" --stealth

# 限制最大输出字符数
node scripts/fetch.mjs "https://example.com/article" 15000

# JSON 输出（包含 mode、selector、content_length）
node scripts/fetch.mjs "https://example.com/article" --json
```

```text
域名路由建议
- mp.weixin.qq.com → 直接用 --stealth
- zhuanlan.zhihu.com → 直接用 --stealth
- juejin.cn → 直接用 --stealth
- sspai.com / blog.csdn.net / openai.com / blog.google → 先用默认模式
```

## 检查清单

- 当前环境是否有可用 `node`。
- 是否根据域名选择了合适模式，而不是所有站点都强制 stealth。
- 是否优先读取 JSON/Markdown 正文，而不是直接拿错误日志当内容。
- 对提取失败的 URL，是否及时停止重试并回到上层研究流程。
- 图片懒加载站点的正文里，图片链接是否被正确替换到 Markdown。

## 反模式

### FAIL: 无脑重试同 URL

```bash
node scripts/fetch.mjs "https://..." # 失败
node scripts/fetch.mjs "https://..." # 又失败
node scripts/fetch.mjs "https://..." # 还失败
→ 上下文浪费 / 用户时间浪费
```

### PASS: 失败 2 次即停

```bash
node scripts/fetch.mjs "$url" || node scripts/fetch.mjs "$url" --stealth
# 两次失败：
# - 告诉用户 URL 暂不可抓
# - 提出替代：人工复制 / 换备份 URL
# 不继续重试
```

### FAIL: 请求头敏感站点不加 --stealth

```bash
node scripts/fetch.mjs "https://mp.weixin.qq.com/s/..."
# 默认 fast 模式 → 可能拿到空页或跳转页
```

### PASS: 域名路由

```bash
# mp.weixin.qq.com / zhuanlan.zhihu.com / juejin.cn
node scripts/fetch.mjs "$url" --stealth
```
