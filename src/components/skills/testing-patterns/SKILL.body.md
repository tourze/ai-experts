# 通用测试模式

## 适用场景

- 编写或审查测试时，需要确认结构、命名、隔离策略和 mock 边界是否正确。
- 需要选择 fixture 策略、参数化方案或区分 mock/stub/fake 的适用场景。
- 排查测试脆弱、过度 mock、顺序依赖或低信息量断言时做对照。
- 各语言具体语法/工具见对应 skill：`go-testing-patterns`、`python-testing-patterns`、`rust-testing`、`java-junit`、`php-testing`、`javascript-typescript-jest`。

## 通用测试原则

### AAA 结构（Arrange / Act / Assert）

每个测试按三段组织，段间空行分隔：

```
// Arrange — 准备输入数据和前置条件
// Act     — 执行被测行为
// Assert  — 验证结果是否符合预期
```

- 分不清 Arrange/Assert 边界时，说明测试在测多个行为。
- Arrange 只准备当前测试需要的数据，不搭建全局上下文。

### FIRST 原则

| 字母 | 含义 | 检查方式 |
|------|------|----------|
| Fast | 毫秒级完成 | 单个测试超过 100ms 要排查 |
| Independent | 可任意顺序运行 | `--shuffle` 或随机顺序不失败 |
| Repeatable | 任意环境结果一致 | CI 和本地结果不因环境不同 |
| Self-Validating | 无人工判断断言 | 无 `print` / 日志目测 |
| Timely | 紧贴实现编写 | 新功能未配测试 = 未完成 |

### 测试行为合同，不测试内部实现细节

- 测试公共 API 的可观察行为，不访问私有字段、内部缓存、状态标志。
- 内部重构后测试不应当挂（除非行为变化）。
- 保护性断言（`if result == nil`）应当返回明确失败消息，不静默通过。

### 一个测试只验证一个行为

- 一条断言不够时，检查是否跑偏到多行为验证。
- 失败时从测试名即可判断影响范围，不需要读 `stdout` 猜是第几个 case 失败。

## Fixture 策略

| 策略 | 适用场景 | 风险 |
|------|----------|------|
| 每测试独立 setup | 互不影响，推荐默认 | 重复代码多时用 helper |
| 共享 fixture（类级/模块级） | 成本高只创一次的连接/容器 | 状态泄漏、测试间耦合 |
| 惰性初始化 | 只需存在，不关心具体值 | 语义需显式 |

- `beforeEach` / `setup` 中尽量创建新实例，不用 `beforeAll` / `setupClass` 共享可变状态。
- fixture 不应包含业务逻辑；复杂 fixture 用工厂函数或 builder 模式封装。

## Mock / Stub / Fake 选择

| 类型 | 用途 | 何时用 |
|------|------|--------|
| Mock | 验证交互（是否调用、调用参数、次数） | 对不可控的外部边界（网络、队列、第三方 API） |
| Stub | 提供预设返回值 | 被测方需要数据但不在乎来源 |
| Fake | 轻量级替代实现 | 数据库、文件系统、时钟等需要真实语义但可替代的场景 |

过度 mock 的信号：
- mock 了不拥有的类型（被测方不该知道 `PaymentGateway` 接口的存在？）。
- mock 大多导致测试只验证 mock 配置而非真实行为。
- 每次重构都需调整 mock 交互验证 → 优先用 Stub 或 Fake。

## 参数化测试

- 相同断言逻辑、不同输入时用参数化测试。
- 每个参数组合的意义要可从命名理解。
- 优先覆盖：典型值、边界值、空/零输入、异常值、等价类代表。

## 测试命名约定

推荐 `should_<expected>_when_<condition>` 或语言惯例等效模式：

```
should_reject_empty_input
should_calculate_total_when_discount_applied
```

- 测试名是失败时第一线索，不要写 `test_case_1`、`test_works` 或 `test_it_works`。
- 命名中包含被测方法/行为 + 场景 + 预期结果。

## 测试反模式

| 反模式 | 症状 | 修复 |
|--------|------|------|
| 顺序依赖 | 只按特定顺序运行才通过 | 每个测试独立 setup，不依赖 shared state |
| 条件逻辑 in 测试 | `if/switch/for` 判断测试内容 | 拆成多个测试或用参数化 |
| 不清理状态 | 全局变量/DB/文件被污染 | `afterEach` / `teardown` 统一清理 |
| Sleep 代替同步 | `time.Sleep(n)` 等异步完成 | channel / signal / await 驱动完成 |
| 测试私有方法 | 绕过公共 API 直接测私有函数 | 测公共 API 的可观察行为 |
| 全 mock | 外部+内部全部 mock | 仅 mock 不可控边界，业务逻辑用真实现 |
| 低信息量断言 | `assert(result)` 无具体预期 | 断言具体的 fields / counts / error codes |
| 只测 happy path | 缺乏空输入/边界/失败/取消路径 | 写测试前枚举所有路径 |
