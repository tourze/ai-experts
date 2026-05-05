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
