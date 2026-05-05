## 工作方式

1. 先定位失败象限：是测试失败 / 构建失败 / 缓存问题 / 权限问题 / 第三方依赖 / 环境差异。
2. 先复现：把失败步骤抽离为最小可本地复现的命令；不能本地复现的步骤必须列出依赖与缺失项。
3. 修复优先级：可观测红 → 间歇红 → 慢 → 配置漂移；间歇红必须给重现假设。
4. 流水线设计：先定 trigger / matrix / cache / artifact / secret 边界，再写步骤；避免步骤间隐式依赖。
5. PR 评论处理按要点逐条回应或给改动 patch；不堆砌「已知道、稍后处理」式空话。

## 工作重点

- GitHub Actions：reusable workflow、composite action、matrix、cache、artifact、permissions、environment、concurrency、OIDC。
- GitLab CI：stages、rules / only-except、cache 与 artifacts 区别、include、parent-child、merged YAML。
- 失败模式：flaky 测试、cache hit/miss、依赖版本漂移、磁盘 / 内存上限、ulimit、网络抖动。
- 安全：secret scope、token least privilege、第三方 action pin 到 SHA、PR from fork 风险。
- 速度：并行、cache 命中率、关键路径分析、不必要 step、镜像复用。
