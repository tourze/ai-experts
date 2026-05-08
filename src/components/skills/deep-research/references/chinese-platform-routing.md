---
Source: github.com/minsight-ai-info/AI-Search-Hub (MIT, snapshot 2026-04)
---

# 中文数据世界路由参考

通用网页搜索对中文平台内部内容（微信公众号、抖音、大众点评、B 站、微博等）覆盖薄弱：这些平台对外搜索引擎做了不同程度的封禁、降权或反爬。要拿到第一手数据，正确做法是把问题路由给「拥有该数据的母公司自家 AI 入口」，再回收结果。

本参考给出三套路由表，按 **数据生态归属 → 主源 → 调用方式** 三层判断。

---

## 1. 按数据生态归属（母公司）路由

| 信号关键词 | 数据生态 | 母公司 | 推荐主源（native AI 入口） | 备选 site: 限定 |
|------------|----------|--------|----------------------------|------------------|
| 微信公众号 / mp.weixin / 腾讯 / QQ | 腾讯系内容 | 腾讯 Tencent | yuanbao.tencent.com | `site:mp.weixin.qq.com` |
| 抖音 / 头条 / TikTok 中国 / 字节跳动 / 火山 / 飞书 | 字节系内容 | 字节跳动 ByteDance | doubao.com | `site:douyin.com` `site:toutiao.com` |
| 美团 / 大众点评 / 外卖 / 本地生活 / 餐饮 / 酒店 / 旅游攻略 / 商户评价 | 美团系内容 | 美团 Meituan | longcat.chat | `site:dianping.com` `site:meituan.com` |
| 淘宝 / 天猫 / 1688 / 阿里巴巴 / 钉钉 / 阿里云 | 阿里系内容 | 阿里巴巴 Alibaba | chat.qwen.ai | `site:taobao.com` `site:tmall.com` |
| 微博 / Sina 热搜 / 中文舆情 | 新浪系 | 新浪 Sina | doubao.com 或 longcat.chat | `site:weibo.com` |
| 长文档阅读 / 研究报告总结 / 长上下文分析 | Moonshot 长文 | 月之暗面 Moonshot | kimi.moonshot.cn | — |
| 明确要求 MiniMax / 海螺 / 海螺AI | MiniMax 生态 | MiniMax | agent.minimaxi.com | — |
| 知乎 / 百度知道 / 中文百科 / 通用中文网页 | 综合中文网络 | 多源 | qwen 或 longcat | `site:zhihu.com` `site:baike.baidu.com` |
| B 站 / bilibili 视频内容 | B 站生态 | bilibili | doubao 或 qwen | `site:bilibili.com` |
| 小红书 / 种草 / 美妆消费 | 小红书生态 | 小红书 | doubao | `site:xiaohongshu.com` |

**未来可达入口**（当前 AI Search Hub 上游标记为 Future，本仓库目前只能通过网页搜索 + `site:` 间接到达）：

| 信号 | 平台 | 母公司 | 当前到达方式 |
|------|------|--------|--------------|
| 网页原生答案、引用充分 | Perplexity | Perplexity AI | 网页搜索 + `site:perplexity.ai` 看公开 share 链接 |
| 复杂推理 / 长文综合 / 多源整理 | Claude.ai | Anthropic | 直接由当前 agent 完成，无需路由 |
| 百度系内容 / 百度搜索结果 | 文心一言 | 百度 Baidu | `site:baidu.com` `site:baijiahao.baidu.com` |

---

## 2. URL 域名 → 主源（用户给链接时）

用户直接给 URL 让你"读 / 抓 / 总结"时，按域名归属选主源；本仓库当前主路径是先转 `web-content-fetcher` 抓正文，下表只用于「正文抓不下来 / 需要平台 native 上下文补充」场景。

| URL 模式 | 主源 | 母公司 |
|----------|------|--------|
| `mp.weixin.qq.com/*` `weixin.qq.com/*` `*.qq.com/*` | yuanbao | 腾讯 |
| `toutiao.com/*` `douyin.com/*` `ixigua.com/*` `feishu.cn/*` `larksuite.com/*` | doubao | 字节跳动 |
| `dianping.com/*` `meituan.com/*` | longcat | 美团 |
| `taobao.com/*` `tmall.com/*` `1688.com/*` `aliyun.com/*` `dingtalk.com/*` | qwen | 阿里巴巴 |
| `weibo.com/*` `weibo.cn/*` | doubao 或 longcat | 新浪 |
| `zhihu.com/*` | qwen 或 longcat | 知乎 |
| `bilibili.com/*` | doubao 或 qwen | bilibili |
| `xiaohongshu.com/*` | doubao | 小红书 |
| `baidu.com/*` `baijiahao.baidu.com/*` | 文心一言（待落地）/ qwen | 百度 |
| `twitter.com/*` `x.com/*` | grok | xAI |
| `*.google.com/*` `youtube.com/*` | gemini | Google |
| `agent.minimaxi.com/*` | minimaxi | MiniMax |

---

## 3. 在当前 agent 上的实际应用

本仓库当前没有内置 fan-out 到上述 native AI 入口的运行时桥（用户可参考上游 [AI-Search-Hub](https://github.com/minsight-ai-info/AI-Search-Hub) 自行架设）。在没有外接执行能力时，按以下顺序降级：

1. **判断生态归属**：用第 1 节关键词或第 2 节 URL 域名，确定主源是哪家。
2. **首选网页搜索 + `site:` 限定**：把限定符叠加到搜索词，例如 `site:mp.weixin.qq.com 新能源汽车 深度分析 2026`。
3. **抓正文**：命中目标 URL 后转 [web-content-fetcher](../../web-content-fetcher/SKILL.md) 提正文。
4. **无 site 命中时回退**：泛中文话题回退 `qwen` 风格泛中文搜索（即不加 `site:` 的中文网页搜索），泛英文话题回退原 deep-research 全景流程。
5. **明确告知局限**：当结果明显是搜索引擎缓存而非平台 native 数据时，在结论里标注"未触达平台 native 内容，仅基于搜索引擎可见摘要"。

---

## 4. 兜底规则

- 不确定中文生态归属 → 默认 `qwen` 风格（最广的中文网页覆盖）。
- 不确定国际归属 → 默认 `gemini` 风格（最广的全球网页覆盖）。
- 用户明确指定平台 → 永远尊重用户选择，不要二次路由。
- 单源失败 → 退到同一类目的次选源（例如 yuanbao 失败 → longcat），不要把同一查询塞回失败源反复重试。
- 时效性强（"今天 / 最近 / 本周"） → 在查询词里带 `<current_date>` 解析出的真实日期，否则容易命中陈旧内容。

---

## 5. 不适用场景

- 国际 / 英文研究：保持原 deep-research 流程（网页搜索全景 + chain-of-verification），不要强行套中文路由。
- 代码库内部问题：转 `wiki-researcher`，不要走任何外部搜索路由。
- 单 URL 正文抓取：先转 `web-content-fetcher`，本路由表只在抓不下或需要平台 native 补充时用。
