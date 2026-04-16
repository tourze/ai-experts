# ReDex Pass 完整参考

运行 `redex-all --reflect-config` 可导出所有参数的完整 JSON 文档。

## 目录

- [体积缩减](#体积缩减)
- [性能提升](#性能提升)
- [结构简化](#结构简化)
- [调试与验证](#调试与验证)
- [执行顺序原则](#执行顺序原则)

---

## 体积缩减

### RemoveUnreachablePass
从根集出发递归标记可达元素，删除不可达代码。
- `remove_no_argument_constructors`, `relaxed_keep_class_members`, `throw_propagation`
- `prune_uninstantiable_insns`, `prune_uncallable_instance_method_bodies`
- `prune_uncallable_virtual_methods`, `prune_unreferenced_interfaces`

### ShortenSrcStringsPass
用 APK 中已有的短字符串替换长文件名。
- `filename_mappings`: 映射输出文件路径

### StripDebugInfoPass
移除不会抛异常的指令的调试信息。
- `drop_all_dbg_info`, `drop_local_variables`, `drop_line_numbers`
- `drop_src_files`, `drop_prologue_end`, `drop_epilogue_begin`, `use_allowlist`
- **顺序**：应早期运行，在内联 pass 之前

### AnnoKillPass
移除运行时不使用的注解。
```json
"AnnoKillPass": {
  "keep_annos": ["Landroid/view/ViewDebug$CapturedViewProperty;"],
  "kill_annos": ["Lcom/google/inject/BindingAnnotation;"],
  "kill_bad_signatures": true
}
```

### RemoveUnusedFieldsPass
删除未读字段，将非静态内部类尽可能静态化。

### RemoveUnusedArgsPass
移除非虚方法和非继承层级虚方法的无用参数。

### RenameClassesPassV2
将类名缩短为 `X.A1c` 形式，兼顾体积、混淆和类排序性能。尊重资源引用、blocklist 和反射。

### ObfuscatePass
混淆方法和字段名（类名由 RenameClassesPassV2 处理）。

### DedupBlocksPass
合并方法内代码和后继完全相同的代码块。
- **顺序**：应在 InterDexPass 之后运行

### StringConcatenatorPass
优化静态初始化器中的多次字符串拼接。

### StringBuilderOutlinerPass
识别重复的 StringBuilder 调用序列并 outline 成独立方法。

---

## 性能提升

### MethodInlinePass
内联方法调用。不能内联构造器（Android verifier 要求 init 调用）。
- **顺序**：不能在 InterDexPass 之后运行

### BridgeSynthInlinePass
内联编译器生成的 bridge/synthetic 方法，将私有字段提升为 public 以允许直接访问。

### FinalInlinePassV2
确定 `<clinit>` 执行后的静态字段值并内联，消除冗余写入。实例字段限制：多构造器、反射/native 访问、构造器内调用的方法中访问的字段不能内联。不内联 CharSequence。

### ConstantPropagationPass
编译期常量替换，全程序迭代分析直到不动点。
- **顺序**：应在 DCE pass 之前运行

### CopyPropagationPass
消除基本块中寄存器的重复值写入。
- **顺序**：应在 DCE pass 之前运行

### RegAllocPass
Chaitin-Briggs 寄存器分配算法，减少溢出。

### StaticReloPassV2
将仅被一个类调用的静态成员搬到该类。

### ReorderInterfacesDeclPass
按接口调用频率重排接口列表。

### PeepholePass
模式匹配替换低效代码片段。
- **顺序**：应早期运行

---

## 结构简化

### SingleImplPass
移除只有一个实现的接口，将接口引用替换为实现类引用。

### DelSuperPass
删除仅调用 super 并返回的虚方法。

### AccessMarkingPass
标记方法/字段为 final/private 以启用更激进优化。
- `finalize_methods` (默认 true), `finalize_classes` (默认 true)
- `privatize_methods` (默认 true), `finalize_unwritten_fields` (默认 true)
- `finalize_written_fields` (默认 false)
- **顺序**：应早期运行

### MethodDevirtualizationPass
将单实现虚方法转为静态方法。
```json
"MethodDevirtualizationPass": {
  "staticize_vmethods_not_using_this": true,
  "staticize_dmethods_not_using_this": true
}
```

### ClassMergingPass
合并结构相同的类，对框架生成代码特别有效。

### OptimizeEnumsPass
用 ordinal 替换 packed switch 中的 enum，部分 enum 替换为 Integer 单例。
不可优化：抽象 enum、反射使用、含非基本类型或非 final 实例字段、被强转为其他类型。

### RemoveInterfacePass
移除互相继承的接口层级，替换为调度桩。对 GraphQL fragment model 特别有效。

### RemoveBuildersPass
移除不逃逸栈帧且无静态成员的 trivial builder。

### ResultPropagationPass
优化 builder 链式调用。

---

## 调试与验证

### CheckBreadcrumbsPass
验证无残留的已删类引用，确认字段/方法引用存在。

### LocalDcePass
删除方法内无副作用的死指令（函数级，区别于 RemoveUnreachablePass 的全程序级）。

### OriginalNamePass
在 debug 构建中恢复原始类名以保持日志一致性。

---

## 执行顺序原则

1. **早期运行**：AccessMarkingPass、PeepholePass、StripDebugInfoPass
2. **在 DCE 之前**：ConstantPropagationPass、CopyPropagationPass
3. **在内联之前**：StripDebugInfoPass
4. **在 InterDexPass 之后**：DedupBlocksPass
5. **不能在 InterDexPass 之后**：MethodInlinePass
