# 描述优化与打包

## 触发 Eval 查询

`description` 字段是主要的触发面。在创建或改进 skill 后，当触发准确性重要时，提供描述优化。

创建约 20 条 eval 查询：

- 8-10 条 `should_trigger`
- 8-10 条 `should_not_trigger`

查询必须看起来像真实的用户提示。包含具体的文件、上下文、URL、数据列、任务措辞、缩写、拼写错误和随意用语。避免明显的玩具提示。

好的反面例子是接近命中的情况：共享关键词或概念，但应路由到其他 skill。避免过于简单的无关反面例子。

## 用户审查 Eval 集

使用 `assets/eval_review.html`：

1. 将 `__EVAL_DATA_PLACEHOLDER__` 替换为 JSON 数组，不要作为引用字符串。
2. 替换 `__SKILL_NAME_PLACEHOLDER__`。
3. 替换 `__SKILL_DESCRIPTION_PLACEHOLDER__`。
4. 写入临时 HTML 文件，在有浏览器可用时打开。
5. 导出后，如果需要，从下载目录读取最新的 `eval_set.json`。

糟糕的 eval 查询会直接损害优化质量，因此在运行优化循环前让用户审查。

## 运行优化

保存审查后的 eval 集。如果生成的 Procedure 表中包含自动优化循环，使用该生成命令，传入 eval 集、skill 路径、当前模型、最大五次迭代和详细进度。

使用当前会话实际使用的模型，以使触发行为匹配用户体验。

循环将数据拆分为训练集和保留测试集，多次运行每个查询以确保稳定性，提出改进的描述，并根据保留测试集分数（而非训练集分数）选择 `best_description`。

当当前平台没有可用的自动循环 Procedure 时，调用 `skill-creator-improve-description` 获取候选描述，并在应用前手动验证保留测试集查询。报告结果来自自动循环还是手动保留测试集验证。

## 应用结果

读取 JSON 输出，提取 `best_description`，更新 skill 的前置元数据或结构化源字段，并显示前后对比及分数变化。

记住触发机制：模型会看到可用的 skill 名称和描述，并且仅在任务看起来需要额外能力时才请求 skill。非常简单的一步式提示可能不会触发任何 skill，即使关键词匹配。

## 打包

如果文件展示工具可用，通过调用 `SKILL.md` 中显示的 `skill-creator-package-skill` Procedure 命令进行打包，将默认空参数替换为：

```json
{
  "args": ["<path/to/skill-folder>"]
}
```

报告生成的 `.skill` 路径和适合环境的安装说明。

## 环境适配

Claude.ai：

- 没有 subagent。
- 自己顺序运行 eval 案例。
- 跳过基线、盲比较和基于 CLI 的描述优化。
- 内联显示结果。

Cowork/headless：

- 使用静态浏览器输出。
- 要求用户导出 `feedback.json`。
- 在工作流期望用户审查时，在自评分之前生成浏览器。

更新已安装的 skill：

- 保留现有名称。
- 如果安装路径是只读的，在编辑前复制到 `/tmp/<skill-name>/`。
- 从临时可编辑副本进行打包。
