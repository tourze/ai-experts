# slog 结构化日志深度参考
## 基本用法

```go
slog.Info("request completed",
    slog.String("method", r.Method),
    slog.String("path", r.URL.Path),
    slog.Int("status", statusCode),
    slog.Duration("elapsed", elapsed),
)
```

## slog.With 预置上下文字段

```go
reqLogger := slog.With(
    slog.String("request_id", requestID),
    slog.String("trace_id", traceID),
)
reqLogger.Info("cache hit", slog.String("key", key))          // 自动携带 request_id, trace_id
reqLogger.Error("db query failed", slog.Any("err", err))
```

预置字段在请求入口创建，通过 context 传递给下层函数。

## context 传递 logger

```go
func WithLogger(ctx context.Context, l *slog.Logger) context.Context {
    return context.WithValue(ctx, loggerKey{}, l)
}
func FromContext(ctx context.Context) *slog.Logger {
    if l, ok := ctx.Value(loggerKey{}).(*slog.Logger); ok { return l }
    return slog.Default()
}
```

## 自定义 Handler — 注入 trace_id / span_id

```go
type traceHandler struct{ slog.Handler }

func (h *traceHandler) Handle(ctx context.Context, r slog.Record) error {
    if span := trace.SpanFromContext(ctx); span.IsRecording() {
        sc := span.SpanContext()
        r.AddAttrs(
            slog.String("trace_id", sc.TraceID().String()),
            slog.String("span_id", sc.SpanID().String()),
        )
    }
    return h.Handler.Handle(ctx, r)
}
```

## 日志级别指南

| 级别 | 使用场景 | 生产默认 |
|------|----------|----------|
| DEBUG | 开发调试、热路径详细输出 | 关闭 |
| INFO | 业务事件（请求完成、任务开始） | 开启 |
| WARN | 可恢复异常（重试成功、降级触发） | 开启 |
| ERROR | 需人工介入（写入失败、外部不可用） | 开启 |

原则：ERROR 不该每小时几百条；频繁触发的"ERROR"实为 INFO 或 WARN。

## PII 脱敏

在 Handler 层统一过滤，不在业务代码逐处处理：

```go
type redactHandler struct {
    slog.Handler
    sensitive map[string]bool // {"password": true, "token": true}
}

func (h *redactHandler) Handle(ctx context.Context, r slog.Record) error {
    var attrs []slog.Attr
    r.Attrs(func(a slog.Attr) bool {
        v := a
        if h.sensitive[a.Key] { v = slog.String(a.Key, "***") }
        attrs = append(attrs, v)
        return true
    })
    nr := slog.NewRecord(r.Time, r.Level, r.Message, r.PC)
    nr.AddAttrs(attrs...)
    return h.Handler.Handle(ctx, nr)
}
```

## 高吞吐日志采样

热路径每秒数千请求时，采样 Handler 只记录部分日志，ERROR 始终全量：

```go
type samplingHandler struct {
    slog.Handler
    counter atomic.Int64
    rate    int64 // 每 N 条记录 1 条
}

func (h *samplingHandler) Enabled(ctx context.Context, level slog.Level) bool {
    if level >= slog.LevelError { return true }
    return h.counter.Add(1)%h.rate == 0
}

// 使用
slog.SetDefault(slog.New(&samplingHandler{
    Handler: slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}),
    rate:    100,
}))
```

## 快速参考

```go
slog.Info("msg", slog.String("k", "v"))            // 单字段
slog.With(slog.String("k", "v"))                    // 预置字段
slog.Error("msg", slog.Any("err", err))             // 错误
slog.LogAttrs(ctx, slog.LevelInfo, "msg", attrs...) // 低分配版本
```
