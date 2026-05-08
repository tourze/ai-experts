# Skill Creator 数据结构

本文记录 skill-creator 生成和读取的结构。字段名是程序契约，必须保持英文原样。

## cases.yaml

位置：`evals/cases.yaml`。定义某个 skill 的触发测试用例。评估流程也兼容旧 JSON eval set，但源码侧默认使用 `cases.yaml`。

```yaml
cases:
  - id: should_trigger_release_check
    prompt: "帮我检查这个发布计划是否可以上线。"
    fixtures: []
    rubric:
      - "触发发布检查 skill"
      - "输出上线风险和阻断项"
    trigger_expected: true

  - id: should_not_trigger_general_copy
    prompt: "帮我润色这段发布公告。"
    fixtures: []
    rubric:
      - "不触发发布检查 skill"
      - "任务应交给写作或文案相关 skill"
    trigger_expected: false
```

| 字段 | 说明 |
|------|------|
| `cases[].id` | 稳定用例 ID，使用小写短横线或下划线 |
| `cases[].prompt` | 用户可能真实输入的任务 |
| `cases[].fixtures` | 可选输入文件路径，相对于 skill root |
| `cases[].rubric` | 人类可读的通过标准或路由期望 |
| `cases[].trigger_expected` | 是否应该触发当前 skill |

## history.json

位置：workspace root。用于 Improve mode 的版本记录。

```json
{
  "started_at": "2026-01-15T10:30:00Z",
  "skill_name": "pdf",
  "current_best": "v2",
  "iterations": [
    {
      "version": "v2",
      "parent": "v1",
      "expectation_pass_rate": 0.85,
      "grading_result": "won",
      "is_current_best": true
    }
  ]
}
```

`grading_result` 只能使用 `"baseline"`、`"won"`、`"lost"` 或 `"tie"`。

## grading.json

位置：`<run-dir>/grading.json`。由 grader agent 生成。

```json
{
  "expectations": [
    {
      "text": "The output includes the name 'John Smith'",
      "passed": true,
      "evidence": "在 transcript Step 3 中发现 John Smith"
    }
  ],
  "summary": {"passed": 1, "failed": 0, "total": 1, "pass_rate": 1.0},
  "execution_metrics": {"total_tool_calls": 15, "errors_encountered": 0},
  "timing": {"total_duration_seconds": 191.0},
  "claims": [
    {
      "claim": "The form has 12 fillable fields",
      "type": "factual",
      "verified": true,
      "evidence": "field_info.json 中数到 12 个字段"
    }
  ],
  "user_notes_summary": {
    "uncertainties": [],
    "needs_review": [],
    "workarounds": []
  },
  "eval_feedback": {
    "suggestions": [],
    "overall": "No suggestions, evals look solid"
  }
}
```

| 字段 | 说明 |
|------|------|
| `expectations[]` | 逐条评分结果，必须使用 `text`、`passed`、`evidence` |
| `summary` | 通过/失败汇总 |
| `execution_metrics` | executor 的 `metrics.json` 内容或摘要 |
| `timing` | wall clock timing，来自 `timing.json` |
| `claims` | 从输出中抽取并验证的 claims |
| `user_notes_summary` | executor 标出的不确定、需 review 或 workaround |
| `eval_feedback` | 可选；只在 grader 发现 eval 问题时出现 |

## metrics.json

位置：`<run-dir>/outputs/metrics.json`。由 executor agent 生成。

```json
{
  "tool_calls": {"Read": 5, "Write": 2, "Bash": 8},
  "total_tool_calls": 15,
  "total_steps": 6,
  "files_created": ["filled_form.pdf"],
  "errors_encountered": 0,
  "output_chars": 12450,
  "transcript_chars": 3200
}
```

## timing.json

位置：`<run-dir>/timing.json`。子代理完成通知中包含 `total_tokens` 和 `duration_ms`，必须立刻保存，之后无法恢复。

```json
{
  "total_tokens": 84852,
  "duration_ms": 23332,
  "total_duration_seconds": 23.3,
  "executor_duration_seconds": 165.0,
  "grader_duration_seconds": 26.0
}
```

## benchmark.json

位置：`benchmarks/<timestamp>/benchmark.json`。由 benchmark 聚合生成，viewer 精确读取这些字段名。

```json
{
  "metadata": {
    "skill_name": "pdf",
    "skill_path": "/path/to/pdf",
    "executor_model": "claude-sonnet-4-20250514",
    "analyzer_model": "most-capable-model",
    "timestamp": "2026-01-15T10:30:00Z",
    "evals_run": [1, 2, 3],
    "runs_per_configuration": 3
  },
  "runs": [
    {
      "eval_id": 1,
      "eval_name": "Ocean",
      "configuration": "with_skill",
      "run_number": 1,
      "result": {
        "pass_rate": 0.85,
        "passed": 6,
        "failed": 1,
        "total": 7,
        "time_seconds": 42.5,
        "tokens": 3800,
        "tool_calls": 18,
        "errors": 0
      },
      "expectations": [{"text": "...", "passed": true, "evidence": "..."}],
      "notes": ["使用 2023 数据，可能过期"]
    }
  ],
  "run_summary": {
    "with_skill": {
      "pass_rate": {"mean": 0.85, "stddev": 0.05, "min": 0.80, "max": 0.90},
      "time_seconds": {"mean": 45.0, "stddev": 12.0, "min": 32.0, "max": 58.0},
      "tokens": {"mean": 3800, "stddev": 400, "min": 3200, "max": 4100}
    },
    "without_skill": {
      "pass_rate": {"mean": 0.35, "stddev": 0.08, "min": 0.28, "max": 0.45},
      "time_seconds": {"mean": 32.0, "stddev": 8.0, "min": 24.0, "max": 42.0},
      "tokens": {"mean": 2100, "stddev": 300, "min": 1800, "max": 2500}
    },
    "delta": {"pass_rate": "+0.50", "time_seconds": "+13.0", "tokens": "+1700"}
  },
  "notes": ["with_skill 在 table extraction expectations 上稳定通过"]
}
```

关键约束：

- `configuration` 必须是 viewer 可识别的配置名，例如 `"with_skill"`、`"without_skill"`、`"old_skill"`
- `pass_rate` 必须位于 `runs[].result.pass_rate`，不要放在 run 顶层
- `run_summary.delta` 使用带符号字符串，例如 `"+0.50"`

## comparison.json

位置：`<grading-dir>/comparison-N.json`。由 blind comparator 生成。

```json
{
  "winner": "A",
  "reasoning": "输出 A 完整解决任务；输出 B 缺少日期字段。",
  "rubric": {
    "A": {"content_score": 4.7, "structure_score": 4.3, "overall_score": 9.0},
    "B": {"content_score": 2.7, "structure_score": 2.7, "overall_score": 5.4}
  },
  "output_quality": {
    "A": {"score": 9, "strengths": ["方案完整"], "weaknesses": []},
    "B": {"score": 5, "strengths": ["可读"], "weaknesses": ["缺少日期字段"]}
  },
  "expectation_results": {
    "A": {"passed": 4, "total": 5, "pass_rate": 0.8, "details": []},
    "B": {"passed": 3, "total": 5, "pass_rate": 0.6, "details": []}
  }
}
```

没有 expectations 时，省略 `expectation_results`。

## analysis.json

位置：`<grading-dir>/analysis.json`。由 post-hoc analyzer 生成。

```json
{
  "comparison_summary": {
    "winner": "A",
    "winner_skill": "path/to/winner/skill",
    "loser_skill": "path/to/loser/skill",
    "comparator_reasoning": "简述 comparator 为什么选择胜者"
  },
  "winner_strengths": ["步骤清晰"],
  "loser_weaknesses": ["指令含糊"],
  "instruction_following": {
    "winner": {"score": 9, "issues": []},
    "loser": {"score": 6, "issues": ["没有使用模板"]}
  },
  "improvement_suggestions": [
    {
      "priority": "high",
      "category": "instructions",
      "suggestion": "把模糊指令改成明确步骤",
      "expected_impact": "减少行为不一致"
    }
  ],
  "transcript_insights": {
    "winner_execution_pattern": "读取 skill -> 执行流程 -> 验证输出",
    "loser_execution_pattern": "读取 skill -> 尝试多种路径 -> 未验证"
  }
}
```
