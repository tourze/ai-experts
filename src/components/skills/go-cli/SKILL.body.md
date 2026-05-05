## 适用场景

- 使用 Cobra 构建 CLI 命令结构（root + subcommands）。
- 需要配置分层：默认值 → 配置文件 → 环境变量 → flags。
- 需要信号处理与优雅停机（os/signal + context）。
- 定义退出码约定或注入版本信息（-ldflags）。
- 生成 shell 自动补全（Bash / Zsh / Fish / PowerShell）。
- 相关 skill：
  并发停机编排配合 [go-concurrency-patterns](../go-concurrency-patterns/SKILL.md)；
  错误语义设计配合 [go-error-handling](../go-error-handling/SKILL.md)；
  项目布局配合 [go-project-layout](../go-code-style/SKILL.md)。

## 核心约束

- 命令结构用 Cobra；配置管理用 Viper；两者通过 `viper.BindPFlag` 桥接，不要手写 flag 解析。
- 配置按优先级覆盖：默认值 < 配置文件 < 环境变量 < 命令行 flags。
- 退出码遵循 Unix 惯例：0 成功，1 一般错误，2 用法错误。不要自创退出码。
- 版本信息通过 `-ldflags` 在构建时注入，不要硬编码。
- 长运行命令必须捕获 SIGINT/SIGTERM 并通过 context 取消传播。
- 每个 subcommand 独立文件，root command 在 `cmd/root.go`。

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

## 常见错误

| 错误 | 修复 |
|------|------|
| 手写 flag 解析不用 Cobra | 用 `cobra.Command` 统一管理 |
| 配置文件覆盖命令行 flags | 调整优先级：flags > env > file > defaults |
| `os.Exit()` 在 deferred 函数之前调用 | `Execute()` 返回 error，在 `main` 里 exit |
| 忽略 SIGTERM 导致容器强杀 | `signal.NotifyContext` + context 传播 |
| 版本号硬编码 | `-ldflags -X` 构建时注入 |
| shell 补全不完整 | 用 Cobra 内置 `completion` 子命令生成 |

## 深度参考

- [cobra-patterns.md](references/cobra-patterns.md) — root 设置、subcommand 注册、Persistent/Local flags、PreRun hooks、信号处理、退出码
- [Cobra 官方文档](https://github.com/spf13/cobra)
- [Viper 官方文档](https://github.com/spf13/viper)
- [Go SIGTERM 优雅停机模式](https://pkg.go.dev/os/signal)
