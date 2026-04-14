---
name: api-trace-reader
description: "在需要只读追踪接口、任务、事件或定时任务调用链时使用；输出入口、调用链、数据读写、异步副作用、风险点和验证方式，禁止任何写操作。"
---

# api-trace-reader

## 适用场景
- 当用户问“这个接口都干了什么”“什么情况会触发”“帮我串一下调用链”时使用。
- 适合定位数据库写入、缓存变更、消息投递、定时任务和事件监听的真实来源。
- 交叉引用：若要做系统级问题盘点，配合 `exhaustive-systems-analysis`；若要审方案而不是追链路，改用 `plan-review`。

## 核心约束
- 只允许只读操作：`Read` / `Grep` / `Glob` / 只读 Bash。
- 禁止 `Edit` / `Write` / 迁移 / 清缓存 / 推送 / 任何会改状态的命令。
- 每条结论必须带 `file:line`、日志片段或 grep 证据，禁止“我猜”。
- 输出标题固定为 `入口`、`调用链`、`数据读写`、`异步副作用`、`风险点`、`验证方式`。

## 代码模式
- 先读 `skills/api-trace-reader/references/entry-types.md` 判断入口类型。
- 调用链格式遵循 `skills/api-trace-reader/references/output-example.md`。
- 风险分级使用 `skills/api-trace-reader/references/risk-rubric.md`。


## 检查清单
- 是否确认了入口是 HTTP、CLI、消费者、定时任务、事件还是 webhook。
- 是否列出了每一级调用者、被调者和关键参数流向。
- 是否单列了 READ / WRITE / CACHE / MQ / EXTERNAL / FS 副作用。
- 是否补齐异步链路、重试逻辑、监听器和延迟任务。

## 反模式
- 一边追链路一边改代码。
- 只追主干，不追异步副作用。
- 没有 `file:line` 就下结论。
- 把“未找到证据”写成“没有这个行为”。
