# Bases 函数速查

这份速查只保留已经按官方文档核对过的高频函数与注意事项，避免继续维护一份容易漂移的“本地全量镜像”。完整函数表以官方文档为准：

- `https://help.obsidian.md/bases/functions`
- `https://help.obsidian.md/bases/syntax`

## 全局函数

| 函数 | 用途 | 示例 |
|------|------|------|
| `date(string)` | 解析日期字符串 | `date("2025-01-01 12:00:00")` |
| `duration(string)` | 显式构造 duration | `duration("1d") * 2` |
| `now()` | 当前日期时间 | `now()` |
| `today()` | 今天零点日期 | `today()` |
| `if(cond, a, b)` | 条件分支 | `if(status == "done", "✅", "⏳")` |
| `file(path)` | 把路径或链接解析成 File | `file("Projects/Plan.md")` |
| `link(path, display?)` | 构造链接值 | `link("Daily/2025-04-14", "Today")` |
| `list(value)` | 单值转列表 | `list(tags)` |
| `number(value)` | 尝试转数值 | `number("3.4")` |
| `min(...)` / `max(...)` | 取最小 / 最大值 | `max(score, 10)` |
| `html(string)` | 生成可渲染 HTML | `html("<b>hot</b>")` |
| `icon(name)` | 生成 Lucide 图标 | `icon("arrow-right")` |
| `escapeHTML(string)` | 转义 HTML 特殊字符 | `escapeHTML(note)` |

## 日期与 duration

- 日期加减 duration 可以直接写字符串：`today() + "7d"`、`now() - "1 week"`。
- 对 duration 做标量运算时，duration 必须放左边：`duration("5h") * 2`。
- 两个日期相减得到的是毫秒差值，不是旧版资料里常见的 `.days` / `.hours` 对象：

```text
date("2025-01-02") - date("2025-01-01")   # => 86400000
```

- 常用日期方法与字段：

| 成员 | 用途 | 示例 |
|------|------|------|
| `date.year` / `month` / `day` | 取日期字段 | `date(due).year` |
| `date.date()` | 去掉时间部分 | `now().date()` |
| `date.format(fmt)` | 格式化输出 | `file.mtime.format("YYYY-MM-DD")` |
| `date.time()` | 取时间字符串 | `now().time()` |

## 列表 / 对象 / 正则

| 成员 | 用途 | 示例 |
|------|------|------|
| `list.filter(expr)` | 过滤列表 | `values.filter(value.isType("number"))` |
| `list.map(expr)` | 映射列表 | `values.map(value.toString())` |
| `list.reduce(expr, acc)` | 归约列表 | `values.reduce(acc + value, 0)` |
| `list.flat()` | 扁平化 | `list(tags).flat()` |
| `list.join(sep)` | 拼接字符串 | `file.tags.join(", ")` |
| `list.sort()` / `unique()` | 排序 / 去重 | `file.tags.unique().sort()` |
| `object.keys()` / `values()` | 读对象键值 | `file.properties.keys()` |
| `/regex/.matches(text)` | 正则匹配 | `/abc/.matches("abcde")` |

## File / Link 高频成员

| 成员 | 用途 | 示例 |
|------|------|------|
| `file.name` / `basename` / `path` / `folder` / `ext` | 文件元数据 | `file.ext == "md"` |
| `file.size` / `ctime` / `mtime` | 大小与时间 | `file.mtime > now() - "1 week"` |
| `file.tags` / `links` / `embeds` / `properties` | 内容相关字段 | `file.tags.contains("#book")` |
| `file.hasTag(...)` | 判断标签 | `file.hasTag("book")` |
| `file.hasLink(x)` | 判断是否链接到某文件 | `file.hasLink(this.file)` |
| `file.inFolder(path)` | 判断是否在目录内 | `file.inFolder("Projects")` |
| `file.asLink(display?)` | File 转链接 | `file.asLink("Open")` |
| `link.asFile()` | Link 转 File | `author.asFile()` |
| `link.linksTo(file)` | Link 是否指向文件 | `author.linksTo(this.file)` |

## 需要特别记住的坑

- `file.backlinks` 虽然可用，但官方明确标注性能较重，且 Vault 变化后不会自动刷新；能反向写成 `file.hasLink(this.file)` 时优先改写。
- `displayName` 只影响视图显示，不影响 `filters` 或 `formulas` 的属性名解析。
- 汇总公式里的 `values` 是整列结果集的列表；例如 `values.reduce(acc + value, 0)` 用于自定义汇总。
