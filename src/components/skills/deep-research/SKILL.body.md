# 深度研究

## 适用场景

- 用户明确要求“研究 / 调查 / 比较 / 解释”某个外部主题，且答案依赖联网信息。
- 需要为报告、文章、方案、演示或内容创作准备事实基础。
- 话题包含时效性、争议性或多视角信息，单次搜索不足以覆盖。
- 如果用户已经给出具体 URL，先转到 [web-content-fetcher](../web-content-fetcher/SKILL.md) 抓正文。
- 如果问题是”某个代码库里的 X 怎么工作”，不要用本 skill，用代码库分析工具。

## 核心约束

- 先铺开全景，再钻重点，不要一上来只盯一个关键词。
- 每一轮检索都要回答三个问题：我已经确认了什么、还缺什么、下一轮搜什么。
- 对“今天 / 最近 / 最新 / 本周”类问题，必须使用 `<current_date>` 里的真实日期生成查询词。
- 关键来源要读全文，不要只看搜索摘要；优先官方文档、论文、公告、权威媒体。
- 明确区分“来源明确给出的事实”和“基于多来源推断的结论”。
- 结论阶段必须保留来源链路，避免把搜索过程写成流水账。

## 中文数据世界路由

中文平台内部内容（微信公众号、抖音、大众点评、微博、B 站、小红书）通用 WebSearch 覆盖薄弱，先按母公司归属选主源再下查询：

- 判断生态归属（腾讯/字节/美团/阿里/新浪/小红书…），完整决策表见 [`references/chinese-platform-routing.md`](references/chinese-platform-routing.md)。
- 用 `WebSearch + site:目标域名` 锁定主源，命中 URL 转 [web-content-fetcher](../web-content-fetcher/SKILL.md) 抓正文。
- site: 无命中时如实标注"未触达平台 native 内容"，不要假装拿到完整数据。
- 国际话题保持原全景流程，不强套中文路由。

## 代码模式

```text
第 1 轮：主话题全景检索
- 目标：确认主题边界、主要分支、关键参与方

第 2 轮：按分支纵深检索
- 目标：为每个核心分支补齐事实、案例、数据、限制条件

第 3 轮：交叉验证 + Chain-of-Verification
- 目标：补齐时间维度、反方观点、权威来源与最新进展
- 对关键事实执行 chain-of-verification：2-3 个独立来源交叉确认，记录分歧
- 高风险声明（医疗/法律/财务/安全）必须命中 A-B 级来源，不接受单一 C 级及以下

第 4 轮：证据收束
- 目标：把高价值页面交给 web-content-fetcher，沉淀为可引用材料
```

```text
查询模板示例
- 基础全景：<topic> overview
- 时间敏感：<topic> <YYYY-MM-DD> OR <Month Day YYYY>
- 对比：<topic A> vs <topic B>
- 权威源：site:官方域名 <topic>
- 反例/限制：<topic> limitations OR criticism
```

## 检查清单

- 是否至少完成了 3 个不同角度的检索，而不是同义词重复搜索。
- 是否读取了最关键来源的正文，而不只是摘要。
- 是否覆盖了事实、案例、趋势、限制和争议点。
- 是否把日期粒度与用户问题对齐。
- 关键事实是否有 2-3 个独立来源支持（chain-of-verification）。
- 是否已经准备好对结果进行归纳总结。


## 反模式

### FAIL: 只搜一次就写结论

```
搜：”React vs Vue 哪个好”
第一条博客：”Vue 更简单”
→ 结论：用 Vue（没看场景、规模、生态对比）
```

### PASS: 多轮分角度检索

```
第 1 轮：overview
第 2 轮：纵深 — “React server components”、”Vue composition API criticism”
第 3 轮：反例 — “why we moved from Vue to React”
第 4 轮：权威源 — site:react.dev、site:vuejs.org
→ 结论带数据 + 限制条件
```

### FAIL: 时效问题只搜年份

```
搜：”最新 AI 进展 2026”
→ 命中可能是 2026 年 1 月的旧新闻
```

### PASS: 带具体日期

```
<current_date>：2026-04-16
搜：”AI news 2026-04” OR “April 2026”
site:openai.com OR site:anthropic.com
```

### FAIL: 只找支持论据

```
想论证”远程办公提升效率”→ 只搜支持博客，忽略反对研究
```

### PASS: 主动找反例

```
搜 “<topic> criticism” / “limitations” / “why failed”
→ 同时呈现支持/反对证据
```
