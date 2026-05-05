## 工作重点

- 单一职责：一个 skill 解决一类清晰可验证的任务，不要混入无关方法论。
- 触发域要排他：description 与同组件集 / 邻近 skill 不重叠；重叠时显式标注路由分流。
- 知识深度优先于篇幅：能用 references/ 沉淀的厚资料不要堆进 SKILL.md。
- 脚手架资产（scripts/、references/、assets/、evals/）要可独立运行，不依赖 ai-experts 仓库内部路径。
- 写完 SKILL.md 必须同步组件定义、资源登记和必要索引；漏登记会导致构建产物缺失。
- 演化型修改（skill-evolver）要写下「为什么参考 skill 表现更好」的可验证假设，再迁移模式而不是抄文本。
