# Cobra 常用模式

## Root 命令设置

```go
// cmd/root.go
var rootCmd = &cobra.Command{Use: "myapp", Short: "简短描述"}

func Execute() error { return rootCmd.Execute() }

func init() {
    rootCmd.PersistentFlags().StringP("config", "c", "", "配置文件路径")
    cobra.OnInitialize(initConfig)
}
```

## Subcommand 注册

每个子命令独立文件，通过 `init()` 挂载。用 `RunE` 返回 error，不要用 `Run` + `os.Exit`。

```go
// cmd/serve.go
var serveCmd = &cobra.Command{
    Use: "serve", Short: "启动 HTTP 服务",
    RunE: func(cmd *cobra.Command, args []string) error { return runServe() },
}
func init() { rootCmd.AddCommand(serveCmd) }
```

## Persistent vs Local Flags

- **PersistentFlags**：当前命令及所有子命令共享（如 `--config`、`--verbose`）。
- **Flags**（Local）：仅当前命令有效（如 `serve --port`）。

```go
func init() {
    rootCmd.PersistentFlags().BoolP("verbose", "v", false, "详细输出")
    serveCmd.Flags().IntP("port", "p", 8080, "监听端口")
}
```

## PreRun / PostRun Hooks

执行顺序：`PersistentPreRun` → `PreRun` → `Run` → `PostRun` → `PersistentPostRun`。优先用 `*E` 版本。

```go
var serveCmd = &cobra.Command{
    Use: "serve",
    PersistentPreRunE: func(cmd *cobra.Command, args []string) error {
        return validateConfig()
    },
    PreRunE: func(cmd *cobra.Command, args []string) error { return validatePort() },
    RunE:    func(cmd *cobra.Command, args []string) error { return runServe() },
}
```

## 信号处理模式

长运行命令必须捕获 SIGINT/SIGTERM，关闭逻辑放在 `<-ctx.Done()` 之后，必须设 shutdown 超时。

```go
func runServe() error {
    ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
    defer stop()
    srv := &http.Server{Addr: ":8080"}
    go func() {
        if err := srv.ListenAndServe(); err != http.ErrServerClosed { log.Error("err", err) }
    }()
    <-ctx.Done()
    shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()
    return srv.Shutdown(shutdownCtx)
}
```

## 退出码约定

Cobra 自动处理用法错误（exit code 2：未知 flag、缺少参数）。业务错误在 `main` 中 exit 1。

```go
func main() {
    if err := cmd.Execute(); err != nil {
        fmt.Fprintln(os.Stderr, err)
        os.Exit(1)
    }
}
```

自定义退出码时设置 `SilenceErrors: true` + `SilenceUsage: true`，用 `errors.As` 匹配错误类型后选择 exit code。

## 版本信息注入

通过 `-ldflags` 构建时注入，不要硬编码。

```go
var version = "dev" // -ldflags -X main.version=1.0.0

func init() { rootCmd.Version = version }
```

```bash
go build -ldflags "-X main.version=$(git describe --tags)" -o myapp ./cmd/myapp
```

## Shell 补全

Cobra 内置支持 Bash / Zsh / Fish / PowerShell 补全。注册 `completion` 子命令后调用 `rootCmd.Gen*Completion(os.Stdout)` 生成脚本。安装示例：`source <(myapp completion zsh)`。
