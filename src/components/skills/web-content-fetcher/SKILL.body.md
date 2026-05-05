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
