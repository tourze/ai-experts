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
