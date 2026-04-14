---
name: site-analyze/robots
description: 只需要抓取并解析目标站点 robots.txt、判断各爬虫可访问范围和 Sitemap 时使用。
---

# robots 策略

## 适用场景

- 用户要看某站点是否允许抓取。
- 需要判断 `*`、Googlebot、Baiduspider 等爬虫的开放策略。
- 只关心 robots.txt，不需要其他网络画像信息。

## 核心约束

- 主脚本是 [`06_robots.py`](06_robots.py)。
- 会自动尝试 `https://` 与 `http://`，并跟随重定向。
- 多个连续 `User-agent` 规则要视为同一规则组，不能只保留最后一个。
- `404` 常表示未提供 robots.txt，通常按“默认允许”理解；`403/401` 则是另一类约束。

## 代码模式

```bash
python3 "<skill_dir>/06_robots.py" example.com --json
python3 "<skill_dir>/06_robots.py" https://example.com/docs --json
```

## 检查清单

- 是否记录了最终 URL 和重定向链。
- 是否解析了 `Allow`、`Disallow`、`Sitemap`、`Crawl-delay`。
- 是否对多个 `User-agent` 连续声明做了正确归组。
- 是否把 404 与 403/401 区分解释。

## 反模式

- 只看 HTTP 状态码，不读具体规则。
- 多 `User-agent` 规则只应用到最后一个爬虫。
- 看到 `Disallow: /` 之外的规则却直接判成“完全禁止”。
- 忽略 Sitemap 和 Crawl-delay。
