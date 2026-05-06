## Go 代码模式

### 函数式选项

```go
type Option func(*Server)

func WithPort(port int) Option {
    return func(s *Server) { s.port = port }
}

func NewServer(opts ...Option) (*Server, error) {
    s := &Server{port: 8080, logger: slog.Default()}
    for _, opt := range opts {
        opt(s)
    }
    if s.port < 1 || s.port > 65535 {
        return nil, fmt.Errorf("invalid port %d", s.port)
    }
    return s, nil
}
```

### 带 context 检查的重试

```go
func retry(ctx context.Context, fn func() error, maxAttempts int) error {
    var err error
    for i := 0; i < maxAttempts; i++ {
        if err = ctx.Err(); err != nil {
            return err
        }
        if err = fn(); err == nil {
            return nil
        }
        select {
        case <-ctx.Done():
            return ctx.Err()
        case <-time.After(backoff(i)):
        }
    }
    return fmt.Errorf("after %d attempts: %w", maxAttempts, err)
}
```

### 优雅停机

```go
sigCh := make(chan os.Signal, 1)
signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
<-sigCh
ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
defer cancel()
server.SetKeepAlivesEnabled(false)
if err := server.Shutdown(ctx); err != nil {
    log.Error("shutdown", "err", err)
}
```
