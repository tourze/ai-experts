import { defineRule, defineRuleBody, Platform } from "../../sdk";

export const golangCodingContractRule = defineRule({
  id: "golang-coding-contract",
  title: "Golang Coding Contract",
  description: "读写 Go 源码、测试、模块文件或 Go 工具配置时使用。",
  platforms: [Platform.Claude, Platform.Codex],
  body: defineRuleBody({
    lines: [
      "- 先跑 `gofmt` / `go test` / 项目既有 lint 再讨论风格；错误和边界条件先返回，主路径保持浅缩进。",
      "- `context.Context` 放第一个参数且沿调用链传递；函数参数超过 4 个时优先收敛成配置结构体或领域对象。",
      "- 不丢弃 error；跨函数边界用 `%w` 保留错误链，调用方需要分支时提供 sentinel error 或自定义错误类型并用 `errors.Is` / `errors.As`。",
      "- 每个 goroutine 必须有退出路径；channel 关闭权属于发送方，并发数有上限，错误传播要和 context 取消联动。",
      "- struct literal 默认使用命名字段；成功路径返回空 slice/map 而不是 nil，除非 nil 是明确业务语义。",
      "- table-driven tests 必须有 `name` 和 `t.Run`；集成测试用 build tag 隔离，并发代码要考虑 `go test -race ./...`。",
      "- 性能或安全结论必须有证据：benchmark/profile/benchstat 或明确的信任边界、输入控制面和爆炸半径分析。",
    ],
  }),
  paths: [
    "**/*.go",
    "go.mod",
    "go.sum",
    "go.work",
    "go.work.sum",
    ".golangci.yml",
    ".golangci.yaml",
  ],
  priority: 50,
});
