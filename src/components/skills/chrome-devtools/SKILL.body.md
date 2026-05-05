## 代码模式

```json
[
  {
    "tool": "take_snapshot",
    "reason": "先拿到最新页面结构和 uid"
  },
  {
    "tool": "click",
    "reason": "使用 snapshot 里返回的 uid 点击目标元素"
  }
]
```

```json
[
  {
    "tool": "list_console_messages",
    "reason": "先看前端脚本报错"
  },
  {
    "tool": "list_network_requests",
    "reason": "再看是否有 4xx/5xx 或超时请求"
  },
  {
    "tool": "evaluate_script",
    "reason": "补充 DOM / 全局变量状态，确认页面逻辑是否跑偏"
  }
]
```

```json
[
  {
    "tool": "performance_start_trace",
    "reason": "开启 trace，必要时伴随 reload"
  },
  {
    "tool": "performance_analyze_insight",
    "reason": "读取 LCP、布局抖动和长任务洞察"
  },
  {
    "tool": "take_memory_snapshot",
    "reason": "怀疑泄漏或大对象驻留时补内存证据"
  },
  {
    "tool": "lighthouse_audit",
    "reason": "需要整页质量基线时再跑 Lighthouse"
  }
]
```

## 检查清单

- 是否在交互前拿到最新 `take_snapshot`，而不是凭截图猜元素。
- 是否在多页签场景里确认了当前 page ID，再执行点击、填写或脚本求值。
- 是否把控制台、网络和页面脚本求值结果结合起来，而不是单看某一侧证据。
- 是否在性能排障时先录 trace，再做 insight / memory / Lighthouse，而不是反过来。
- 是否把一次分析得到的 `uid`、request 线索、trace 结论和复现步骤一起记录下来。

## 反模式

### FAIL: 截图 + 坐标点

```
take_screenshot → 看图 → click(187, 624)
→ DOM 变 / 字号变 / 坐标偏移 → 点错
```

### PASS: snapshot → uid

```
take_snapshot  # 拿到最新 uid 树
click(uid=”abc123”)  # 基于语义定位
```

### FAIL: 只看视觉猜

```
“页面白屏 → 看截图 → 看起来是样式问题 → 改 CSS”
→ 实际：API 500 / 控制台 TypeError
```

### PASS: 三方证据

```
list_console_messages   # 脚本错误
list_network_requests   # 4xx/5xx
evaluate_script         # DOM/全局状态
→ 组合判断根因
```
