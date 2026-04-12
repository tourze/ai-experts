---
name: php-doc
description: 当用户编写 phpDoc 注释时调用。提供 Nette 风格的文档块约定：何时跳过文档、类/方法/属性/异常文档、泛型数组类型（array<T>、list<T>）、条件返回类型。当编写或编辑任何 /** */ 注释时使用——即使用户只说"给这个加文档"而未提及 phpDoc。
---

## 文档（phpDoc）

### 黄金法则

**永远不要在没有附加价值的情况下重复签名信息。** 如果类名、方法名、参数名和 PHP 类型已经完整表达了含义，直接跳过文档块。

跳过文档的情况：
- 方法是平凡且自解释的（getter、setter、简单委托）
- 文档块只会重复签名已经表达的内容
- 参数名已经足够描述性（`$width`、`$height`、`$name`）

需要编写文档的情况：
- 方法有非显而易见的行为（在特定条件下返回 null、抛出异常）
- 数组内容需要说明（`@return string[]`）
- 参数有 PHP 类型无法捕获的约束、格式或有效范围
- "为什么"这样设计对调用方很重要

### 编写风格
- 简洁直接——避免不必要的词汇
- 方法描述以第三人称单数现在时动词开头：Returns、Formats、Checks、Creates、Converts、Sets
- 跳过诸如"Class that..."、"Interface for..."、"Method that..."之类的短语
- 不要在类文档块中重复方法列表或实现细节
- 使用主动语态描述主要职责

### 属性文档
简单的 `@var` 注解使用单行格式：

```php
/** @var string[] */
private array $name;
```

非显而易见的属性使用简短注释：
```php
/** 用于向后兼容 */
protected Explorer $context;
```

### 参数和返回值
- 可空类型优先使用 `?Type` 而非 `Type|null`
- 仅当需要补充 PHP 类型之外的信息时才为参数添加文档
- 多参数块使用两空格对齐以提高可读性：
  ```php
  /**
   * @return string  主列序列名称
   * @param  mixed   $var  此处描述
   */
  ```

仅在需要说明以下内容时添加参数文档：
- 额外的上下文或约束
- 限制或条件
- 非常规使用模式

### 泛型数组类型

#### 数组键类型
- `array<T>` = `array<int|string, T>` —— 任意键（省略键类型表示 int|string）
- `array<int, T>` —— 仅限 int 键（不一定连续）
- `array<string, T>` —— 仅限 string 键
- `list<T>` —— 从 0 开始的连续 int 键（0, 1, 2...）

#### 输入与输出的区分
- **@return**：如果函数总是返回连续键，`list<T>` 是准确的
- **@param**：`list<T>` 可能过于严格——可能拒绝非连续键的有效输入

#### 何时对输入使用 `list<T>`
分析实现：
- `foreach ($arr as $v)` —— 不使用键 → `array<T>` 就足够了
- `$arr[0]`、`$arr[1]` —— 按索引访问 → 需要 `list<T>`

#### 条件返回类型
对于依赖参数的返回类型：
```php
/**
 * @return ($flag is true ? list<array{string, int}> : list<string>)
 */
```

#### 如何确定正确的类型
1. 检查实现——数组是如何被使用的？
2. 如果需要，编写一个测试脚本来输出结果结构
3. 对于嵌套数组，逐层分析每个嵌套级别

### 异常文档
- 使用一句自然语言描述问题
- 避免诸如"Exception that is thrown when..."之类的短语
- 使用一致的短语：
  - "does not exist" —— 用于缺失的项目
  - "failed to" —— 用于操作失败
  - "cannot" —— 用于不可能的操作
  - "is not supported" —— 用于不支持的功能

示例：
- "The file does not exist."
- "Cannot access the requested class property."
- "The value is outside the allowed range."
- "Failed to read from or write to a stream."

### 示例

#### 良好的文档

目的清晰，补充了数组内容信息：
```php
/**
 * Returns list of supported languages.
 * @return string[]  语言代码数组
 */
public function getSupportedLanguages(): array
```

描述非常规行为：
```php
/**
 * Creates new transaction. Returns null if user has exceeded daily limit.
 */
public function createTransaction(float $amount): ?Transaction
```

#### 何时跳过

```php
// 签名已经说明一切——不需要文档块
protected readonly string $name;

public function getWidth(): int

public function setName(string $name): void
```

自解释的参数——仅文档化方法目的：
```php
/**
 * Calculates dimensions of image cutout.
 */
public function calculateCutout(int $left, int $top, int $width, int $height): array
```
