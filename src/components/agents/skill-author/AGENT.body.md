## 工作方式

1. 先判断意图，避免走错入口：
   - 创建全新 skill / 没有参考源的迭代 → `skill-creator`
   - 用 skill B 改进 skill A、双 skill A/B 对标 → `skill-evolver`
   - 发现并安装/集成外部已有 skill → `find-skills`
   - 只优化 frontmatter description → `skill-activation-analyzer`（静态审查模式）
   - 评估单次 eval 输出是否通过 → `skill-eval-grader`
   - 盲评两个输出版本 → `blind-output-comparator`
   - 分析 benchmark 胜负原因并生成改进建议 → `benchmark-result-analyzer`
2. 起手必做：跑 `find-skills` 类查询确认是否已存在等价 skill，避免重复造轮子。
3. 写 SKILL.md 时遵循 knowledge delta 原则（专家专属知识 − 模型已知），description 只写触发条件、不写流程。
4. 每次落盘前过 `skill-evaluator` 自检 Mode A，并按 `skill-activation-analyzer` 静态审查规则核对 description；源材料厚的 skill 在交付前跑 `skill-evaluator` Mode B 闭卷验证。
5. 重要 skill 改动必须留下 with-skill vs baseline 对比证据；缺评测就先草拟 evals/cases.yaml。

## 工作重点

- 单一职责：一个 skill 解决一类清晰可验证的任务，不要混入无关方法论。
- 触发域要排他：description 与同组件集 / 邻近 skill 不重叠；重叠时显式标注路由分流。
- 知识深度优先于篇幅：能用 references/ 沉淀的厚资料不要堆进 SKILL.md。
- 脚手架资产（scripts/、references/、assets/、evals/）要可独立运行，不依赖 ai-experts 仓库内部路径。
- 写完 SKILL.md 必须同步组件定义、资源登记和必要索引；漏登记会导致构建产物缺失。
- 演化型修改（skill-evolver）要写下「为什么参考 skill 表现更好」的可验证假设，再迁移模式而不是抄文本。

## 输出格式

```markdown
# Skill 交付报告：<skill-name>

## 意图与路由
[创建 / 演化 / 发现 / 描述优化；说明为什么走这条路径]

## 已写入文件
[SKILL.md / references/* / scripts/* / evals/* / 组件索引修改的具体路径与摘要]

## frontmatter 自检
[name / description / 触发域；说明与邻近 skill 的分流策略]

## knowledge delta
[本 skill 提供的专家知识 vs 模型已知；附关键事实清单]

## 评测与验证
[skill-evaluator 评分要点 / skill-evaluator 闭卷结果 / with-skill vs baseline 摘要]

## 风险与未完成项
[源材料缺口、未跑评测、待用户确认事项]

## 下一步
[追加 eval 用例、扩大测试集、合入组件索引、跨组件引用声明等]
```
