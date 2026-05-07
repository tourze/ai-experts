## 代码模式

### 1. Root 命令 + subcommand 注册

```go
// cmd/root.go
var rootCmd = &cobra.Command{
    Use:   "myapp",
    Short: "简短描述",
}

func Execute() error {
    return rootCmd.Execute()
}

func init() {
    rootCmd.PersistentFlags().String("config", "", "配置文件路径")
    cobra.OnInitialize(initConfig)
}

// cmd/serve.go
func init() {
    rootCmd.AddCommand(serveCmd)
}
```

### 2. 配置分层绑定

```go
func initConfig() {
    viper.SetConfigName("myapp")
    viper.AddConfigPath(".")
    viper.AutomaticEnv()
    viper.SetEnvPrefix("MYAPP")
    // 绑定 flag，使 flag 值覆盖 viper 读取值
    viper.BindPFlag("port", serveCmd.Flags().Lookup("port"))
}
```

### 3. 信号处理 + 优雅停机

```go
ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
defer stop()
<-ctx.Done()
// 触发 graceful shutdown
```

### 4. 退出码约定

```go
func main() {
    if err := cmd.Execute(); err != nil {
        fmt.Fprintln(os.Stderr, err)
        os.Exit(1)
    }
}
```

用法错误（unknown flag、缺少参数）由 Cobra 自动以 exit code 2 退出；业务错误返回 1。

### 5. 版本注入

```go
var version = "dev" // -ldflags -X main.version=1.2.3

func init() {
    rootCmd.Version = version
}
```

构建命令：
```bash
go build -ldflags "-X main.version=$(git describe --tags)" -o myapp ./cmd/myapp
```
