# 复杂度来源详解与代码示例

## 1. 深嵌套（> 3 层）

**症状**：if 里套 if，for 里套 if 再套 try-catch。

**对策**：
- Guard clause / Early return：把异常条件提前返回，减少主路径嵌套。
- 抽取内层逻辑为函数：给内层一个名字，外层只关注控制流。
- 用 continue/break 替代嵌套。

```
# 改前：3 层嵌套
def process(items):
    for item in items:
        if item.is_valid():
            if item.needs_update():
                if item.can_update():
                    do_update(item)

# 改后：guard clause + continue
def process(items):
    for item in items:
        if not item.is_valid():
            continue
        if not item.needs_update():
            continue
        if not item.can_update():
            continue
        do_update(item)
```

## 2. 长函数（> 30-40 行）

**症状**：一个函数做多件事，需要滚动才能看完。

**对策**：
- 识别函数中的"段落"——空行分隔的代码块通常是独立逻辑步骤。
- 把每个段落抽取为函数，用有意义的名字替代注释。
- 保持抽象层次一致：主函数只调用子步骤，不混入细节。

## 3. 过多参数（> 3-4 个）

**症状**：函数签名很长，调用方查文档才知道第四个参数是什么。

**对策**：
- 引入参数对象/配置对象：把相关参数合并为一个结构。
- 拆分函数：如果参数多是因为函数做了多件事。
- Builder 模式：如果参数大多是可选的。

## 4. 布尔参数爆炸

**症状**：`process(data, true, false, true)` —— 调用方看不出含义。

**对策**：
- 用枚举/常量替代：`process(data, Mode.STRICT, Output.SILENT)`。
- 拆分为多个函数：如果布尔决定了完全不同的执行路径。
- 用配置对象：把多个开关合并。

## 5. 特性嫉妒（Feature Envy）

**症状**：函数大量访问另一个对象的内部数据。

**对策**：
- 把逻辑移到数据所在的类/模块。
- 无法移动时，至少在数据方提供封装方法。

## 6. 原始类型偏执（Primitive Obsession）

**症状**：用字符串表示邮箱、用整数表示状态、用字典表示所有东西。

**对策**：
- 引入值对象或类型别名，让类型系统帮助约束。
- 把散落各处的验证逻辑收敛到值对象构造函数中。

## 7. 条件表达式过长

**症状**：`if (a && b || c && !d && (e || f))`

**对策**：
- 抽取为命名布尔变量：`is_eligible = a && b`。
- 抽取为函数：`if is_eligible(user)`。
- 用查找表替代多分支。

## 8. 重复条件检查

**症状**：同一个 null check 或权限检查在多处重复。

**对策**：
- 把检查移到更早的边界（入口处校验一次）。
- 使用类型系统消除 null（Option/Optional、NonNull 标注）。
