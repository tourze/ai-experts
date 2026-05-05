# Obsidian Bases

## 适用场景

- 用户要新建、修复或重构 `.base` 文件。
- 用户要定义 Bases 的 `filters`、`formulas`、`properties`、`summaries` 或 `views`。
- 用户要做 table / list / cards / map 视图切换，或想把 Base 嵌入笔记。
- 用户要把某个查询逻辑从 Dataview 风格思路改写成官方 Bases 语法。
- 如果用户要通过命令行查询或操作 Base 条目，使用 Obsidian CLI 工具。

## 核心约束

- `.base` 文件必须是合法 YAML。Bases 没有 Dataview / SQL 风格的 `from`、`source` 段，结果集完全由 `filters` 决定。
- 全局 `filters` 和视图级 `filters` 在求值时会用 `AND` 拼接；不要把同一条件在两层重复堆叠。
- 属性分三类：笔记属性 `note.foo` 或简写 `foo`、文件属性 `file.*`、公式属性 `formula.*`。
- 日期相减返回的是“毫秒差”，不是带 `.days` / `.hours` 字段的 Duration 对象；只有显式用 `duration("1d")` 这类值时才是在做 duration 运算。
- `this.file.*` 的含义取决于展示位置：主内容区指向 base 文件本身；嵌入时指向嵌入它的文件；侧边栏里指向主内容区活动文件。
- `file.backlinks` 性能较重，且 Vault 变化后不会自动刷新；能用 `file.hasLink(this.file)` 做反向查询时，优先用后者。
- `map` 视图需要额外安装官方 Maps 插件；不要把 map 当成默认可用布局。
- 常用函数速查见 [FUNCTIONS_REFERENCE.md](references/FUNCTIONS_REFERENCE.md)，完整能力以官方文档为准。

## 代码模式

### 1. 最小可工作的 `.base` 骨架

```yaml
filters:
  and:
    - file.hasTag("book")

formulas:
  formatted_price: 'if(price, price.toFixed(2) + " dollars")'

properties:
  formula.formatted_price:
    displayName: Price

views:
  - type: table
    name: "Books"
    order:
      - file.name
      - formula.formatted_price
```

### 2. 视图级过滤、分组与汇总

```yaml
views:
  - type: table
    name: "Open Tasks"
    limit: 20
    groupBy:
      property: status
      direction: DESC
    filters:
      and:
        - 'status != "done"'
    order:
      - file.name
      - status
      - due
    summaries:
      due: Earliest
```

### 3. 正确处理日期、链接与 `this`

```yaml
formulas:
  due_in_ms: 'if(due, date(due) - today(), null)'
  next_week: '(today() + "7d").format("YYYY-MM-DD")'
  links_active_file: 'file.hasLink(this.file)'
  file_link: 'file.asLink("Open")'
```

### 4. 嵌入 Base 文件或 `base` 代码块

```markdown
![[Reading.base]]
![[Reading.base#Books]]
```

```base
filters:
  and:
    - file.hasTag("example")
views:
  - type: table
    name: "Table"
```

## 检查清单

- 文件后缀是否为 `.base`，并且整份 YAML 已通过基本语法校验。
- 有没有混入 `from`、`source`、`where` 这类 Dataview / SQL 心智残留。
- `formula.X` 在 `order`、`properties`、`summaries` 里被引用前，是否已在 `formulas` 中定义。
- 日期计算是否按“毫秒差”处理，而不是继续写 `.days` / `.hours` 这类旧语义。
- 过滤表达式与公式字符串是否正确加引号，避免 YAML 因 `:`、引号嵌套或运算符而解析失败。
- 使用 `this.file.*` 时，是否确认了 Base 当前是在主区、嵌入块还是侧栏。
- 需要反链语义时，是否优先考虑 `file.hasLink(this.file)` 而不是直接依赖 `file.backlinks`。
- 使用 `map` 视图时，是否已明确说明需要安装 Maps 插件。

## 反模式

### FAIL: Dataview 心智残留

```yaml
from: "Books"
where: status != "done"
views:
  - type: table
```
→ Bases 没有 `from` / `where`；整个文件解析失败。

### PASS: 用 filters

```yaml
filters:
  and:
    - file.hasTag("book")
    - 'status != "done"'
views:
  - type: table
```

### FAIL: 日期当 Duration 对象

```yaml
formulas:
  overdue_days: '(now() - file.ctime).days'
```
→ 减法返回毫秒数，没有 `.days` 字段。

### PASS: 显式毫秒转换

```yaml
formulas:
  overdue_days: '((now() - file.ctime) / 86400000).toFixed(0)'
```
