# 站点类型架构模板

## SaaS 站点

```text
L0 /
L1 /product /solutions /pricing /customers /resources /docs
L2 /solutions/{use-case} /customers/{industry} /resources/{topic} /docs/{guide}
```

重点：
- `/product` 解释能力，`/solutions` 映射场景，`/pricing` 承接购买决策。
- `/docs` 支持售前自助验证和售后留存。
- 对比页可放在 `/compare/{competitor}`，必须有事实来源和公平比较。

## 电商站点

```text
L0 /
L1 /c/{category} /brands /deals /guides
L2 /c/{category}/{subcategory} /p/{product}
```

重点：
- 分类页承接泛需求，商品页承接具体购买意图。
- 筛选参数必须定义 canonical 和索引规则。
- 缺货页要说明保留、重定向或替代推荐策略。

## 内容站

```text
L0 /
L1 /topics /guides /reviews /tools
L2 /topics/{cluster} /guides/{intent} /reviews/{product}
```

重点：
- 用主题集群组织内容，不按团队内部栏目任意堆叠。
- 栏目页要有摘要、精选内容、更新频率和内链策略。
- 旧文章需要合并、刷新或 noindex 的治理规则。

## 本地服务站

```text
L0 /
L1 /services /locations /pricing /reviews /contact
L2 /services/{service} /locations/{city}
```

重点：
- 服务页回答“做什么”，城市页回答“在哪做、多久到、资质如何”。
- NAP 信息必须一致。
- 本地评价、案例、资质和服务范围是信任信号。

## 输出要求

- 每层页面的职责、搜索意图和转化动作。
- URL 命名规则和是否允许组合页面。
- 哪些页面可索引，哪些页面 noindex 或 canonical 到父级。
