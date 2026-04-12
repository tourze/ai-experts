---
name: phpunit-best-practices
description: 当用户编写、审查或重构 PHPUnit 测试时使用，确保测试套件一致、可维护且高效。当涉及测试创建、测试重构、测试配置、代码覆盖率、数据提供者、Mock 或 PHPUnit XML 配置时触发。
license: MIT
metadata:
  author: pentiminax
  version: "1.0.0"
---

# PHPUnit 最佳实践

全面的 PHPUnit 应用测试最佳实践指南，由 pentiminax 维护。包含 8 个类别共 40 条规则，按影响程度排序，用于指导自动化测试生成、重构和代码审查。

## 适用场景

在以下情况下参考这些指南：
- 编写新的 PHPUnit 测试类或测试方法
- 审查测试代码的质量和一致性
- 重构现有测试套件
- 配置 PHPUnit XML 设置
- 设置代码覆盖率和测试组织

## 规则类别（按优先级）

| 优先级 | 类别 | 影响程度 | 前缀 |
|--------|------|----------|------|
| 1 | 原则与模式 | 关键 | `principle-` |
| 2 | 编码标准 | 关键 | `standard-` |
| 3 | 测试属性 | 高 | `attr-` |
| 4 | 数据管理 | 高 | `data-` |
| 5 | 测试文档 | 中 | `doc-` |
| 6 | Mock | 中 | `mock-` |
| 7 | 集成测试 | 中 | `integration-` |
| 8 | 配置 | 低-中 | `config-` |

## 快速参考

### 1. 原则与模式（关键）

- [rules/principle-aaa-pattern.md](rules/principle-aaa-pattern.md) - 使用 Arrange-Act-Assert 结构化测试
- [rules/principle-first-fast.md](rules/principle-first-fast.md) - 保持测试快速执行
- [rules/principle-first-isolated.md](rules/principle-first-isolated.md) - 确保测试相互独立
- [rules/principle-first-repeatable.md](rules/principle-first-repeatable.md) - 使测试具有确定性
- [rules/principle-first-self-validating.md](rules/principle-first-self-validating.md) - 测试必须有明确的通过/失败结果
- [rules/principle-first-timely.md](rules/principle-first-timely.md) - 与生产代码同步编写测试
- [rules/principle-dry-vs-damp.md](rules/principle-dry-vs-damp.md) - 在测试中平衡 DRY 与可读性

### 2. 编码标准（关键）

- [rules/standard-strict-types.md](rules/standard-strict-types.md) - 在测试文件中声明 strict_types=1
- [rules/standard-final-classes.md](rules/standard-final-classes.md) - 将测试类标记为 final
- [rules/standard-snake-case-methods.md](rules/standard-snake-case-methods.md) - 测试方法名使用 snake_case
- [rules/standard-psr4-naming.md](rules/standard-psr4-naming.md) - 遵循 PSR-4 命名和命名空间约定
- [rules/standard-psr12-formatting.md](rules/standard-psr12-formatting.md) - 应用 PSR-12 代码格式
- [rules/standard-this-over-self.md](rules/standard-this-over-self.md) - 断言使用 $this 而非 self::
- [rules/standard-visibility-type-hints.md](rules/standard-visibility-type-hints.md) - 显式声明可见性和类型提示

### 3. 测试属性（高）

- [rules/attr-test-attribute.md](rules/attr-test-attribute.md) - 使用 #[Test] 属性配合 it_ 前缀
- [rules/attr-covers-class.md](rules/attr-covers-class.md) - 使用 #[CoversClass] 界定覆盖率边界
- [rules/attr-uses-class.md](rules/attr-uses-class.md) - 使用 #[UsesClass] 文档化依赖
- [rules/attr-size-categories.md](rules/attr-size-categories.md) - 按大小分类测试
- [rules/attr-group.md](rules/attr-group.md) - 使用 #[Group] 进行任意分类
- [rules/attr-no-annotations.md](rules/attr-no-annotations.md) - 优先使用 PHP 8 属性而非 PHPDoc 注解

### 4. 数据管理（高）

- [rules/data-provider.md](rules/data-provider.md) - 使用 #[DataProvider] 处理多场景
- [rules/data-provider-external.md](rules/data-provider-external.md) - 使用 #[DataProviderExternal] 共享数据
- [rules/data-test-with.md](rules/data-test-with.md) - 使用 #[TestWith] 内联数据集
- [rules/data-factory-method.md](rules/data-factory-method.md) - 工厂方法实例化被测系统
- [rules/data-direct-instantiation.md](rules/data-direct-instantiation.md) - 简单构造器直接实例化

### 5. 测试文档（中）

- [rules/doc-testdox.md](rules/doc-testdox.md) - 使用 TestDox 生成可执行规格说明
- [rules/doc-testdox-attribute.md](rules/doc-testdox-attribute.md) - #[TestDox] 属性自定义显示
- [rules/doc-readable-names.md](rules/doc-readable-names.md) - 可读的测试名称作为规格说明

### 6. Mock（中）

- [rules/mock-chicago-vs-london.md](rules/mock-chicago-vs-london.md) - 芝加哥 vs 伦敦 TDD 流派
- [rules/mock-prophecy.md](rules/mock-prophecy.md) - Prophecy 富表达力的测试替身
- [rules/mock-avoid-over-mocking.md](rules/mock-avoid-over-mocking.md) - 避免过度 Mock 内部依赖

### 7. 集成测试（中）

- [rules/integration-smoke-http.md](rules/integration-smoke-http.md) - HTTP 控制器冒烟测试
- [rules/integration-smoke-cli.md](rules/integration-smoke-cli.md) - CLI 命令冒烟测试
- [rules/integration-performance.md](rules/integration-performance.md) - 性能感知的测试准备
- [rules/integration-singleton.md](rules/integration-singleton.md) - 无状态服务使用单例
- [rules/integration-transactions.md](rules/integration-transactions.md) - 数据库事务清理测试数据

### 8. 配置（低-中）

- [rules/config-testsuites.md](rules/config-testsuites.md) - 在命名套件中组织测试
- [rules/config-strictness.md](rules/config-strictness.md) - 启用严格模式设置
- [rules/config-source-coverage.md](rules/config-source-coverage.md) - 覆盖率分析的源目录
- [rules/config-order-by.md](rules/config-order-by.md) - 测试执行排序策略
- [rules/config-cache.md](rules/config-cache.md) - 缓存目录提升性能
- [rules/config-stop-on-failure.md](rules/config-stop-on-failure.md) - 首次失败即停止以快速反馈

## 使用方式

阅读各规则文件获取详细说明和代码示例：

- [rules/principle-aaa-pattern.md](rules/principle-aaa-pattern.md)
- [rules/standard-final-classes.md](rules/standard-final-classes.md)

每个规则文件包含：
- 规则重要性的简要说明
- 错误代码示例及解释
- 正确代码示例及解释
- 附加上下文和参考链接
