# Skill 评估循环

## 工作区布局

将评估结果放在 skill 目录旁边的 `<skill-name>-workspace/` 下。

使用迭代目录：

```text
<skill-name>-workspace/
  iteration-1/
    <eval-name>/
      with_skill/
      without_skill/ or old_skill/
      eval_metadata.json
```

在运行开始时创建目录，而不是一次性全部创建。使用描述性的 eval 名称，而不是 `eval-0`。

## 同时启动 With-Skill 和基线

对于每个 eval，在同一轮中同时启动两个运行：

- `with_skill`：指向当前 skill。
- `without_skill`：用于新创建的 skill。
- `old_skill`：用于改进已有的 skill。在编辑前对旧 skill 进行快照。

不要先运行 with-skill 再运行基线。同轮启动可以减少时间和上下文偏差。

每个 `eval_metadata.json` 以以下内容开始：

```json
{
  "eval_id": 0,
  "eval_name": "descriptive-name",
  "prompt": "The user's task prompt",
  "assertions": []
}
```

## 在运行期间起草断言

不要在运行执行时空闲。起草客观断言并向用户解释它们检查什么。好的断言是可脚本化的、命名清晰的，并且在基准测试浏览器中可理解。

主观 skill 可以使用定性审查而不是强制性的数值断言。

当断言准备就绪时，同时更新 `eval_metadata.json` 和 `evals/cases.yaml`。

## 立即记录时间

当运行完成时，立即捕获通知时间：

```json
{
  "total_tokens": 84852,
  "duration_ms": 23332,
  "total_duration_seconds": 23.3
}
```

将其写入运行目录作为 `timing.json`。这些值之后无法恢复。

## 评分与聚合

对于每次运行，生成 `grading.json`。浏览器期望确切的字段：

- `text`
- `passed`
- `evidence`

不要使用 `name`、`met`、`details` 或其他变体。如果断言可以通过脚本检查，使用脚本而不是人工检查。

通过调用 `SKILL.md` 中显示的 `skill-creator-aggregate-benchmark` Procedure 命令进行聚合，将默认空参数替换为：

```json
{
  "args": ["<workspace>/iteration-N", "--skill-name", "<name>"]
}
```

这会创建 `benchmark.json` 和 `benchmark.md`，包含通过率、时间、token、均值/标准差和变化量。当手写或检查基准数据时，使用 `schemas.md`。

对聚合结果运行分析：

- 始终通过且不能区分 skill 价值的断言。
- 高方差的 eval。
- 时间/token 权衡。
- 摘要统计隐藏了重复定性失败的情况。

## 审查浏览器

使用提供的 Procedure，而不是构建自定义 HTML：

调用 `SKILL.md` 中显示的 `skill-creator-generate-review` Procedure 命令，将默认空参数替换为：

```json
{
  "args": [
    "<workspace>/iteration-N",
    "--skill-name",
    "my-skill",
    "--benchmark",
    "<workspace>/iteration-N/benchmark.json"
  ]
}
```

如果浏览器应保持在后台运行，使用 `nohup ... > /dev/null 2>&1 &` 包装该平台特定的 Procedure 命令。

对于第 2+ 次迭代，还要传入 `--previous-workspace <workspace>/iteration-<N-1>`。

在 headless 或 Cowork 环境中，使用 `--static <output_path>` 并让用户导出 `feedback.json`。

告诉用户浏览器有两个区域：

- Outputs 用于定性审查。
- Benchmark 用于定量比较。

当用户完成审查时，读取 `feedback.json`。空的反馈意味着用户接受了该次运行。优先处理具体反馈而不是模糊偏好。

## 改进循环

收到反馈后：

1. 从失败中归纳。不要只修补示例。
2. 移除浪费 token 或引发无帮助行为的指令。
3. 当跨 eval 出现重复的确定性辅助代码时，添加 eval 本地辅助代码或可重用的 Procedure。
4. 解释新约束存在的原因。
5. 将所有 eval 重新运行到 `iteration-N+1`，包括适当的基线。

当用户满意、反馈为空或额外迭代不再产生有意义的改进时停止。

## 盲比较

为了更严格的 A/B 比较，比较两个输出而不揭示哪个 skill 产生了它们。仅在用户需要比常规审查和基准测试结果更强的证据时使用此方法。
