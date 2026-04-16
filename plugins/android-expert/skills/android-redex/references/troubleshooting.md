# ReDex 排查指南

## 优化后崩溃定位

1. 用 `--stop-pass PassName` 逐个 pass 定位问题引入点
2. 用 `--output-ir` 导出中间 DEX 和 IR 元数据做对比
3. 检查反射 / `instanceof` 是否使用了被移除的类型
4. 在 ProGuard 规则中 `-keep` 被误删的类/接口

## Trace 调试

```bash
# 启用全局 trace
TRACE=1 redex.py input.apk -o output.apk -c config.json

# 按模块设置级别
TRACE=SINGL:3,RMUREACH:2 redex.py ...

# 输出到文件
TRACEFILE=/tmp/redex_trace.txt TRACE=1 redex.py ...
```

## 常见问题速查

| 症状 | 排查方向 |
|---|---|
| 方法数超 64K | 检查 ReBindRefsPass 是否启用 |
| 启动变慢 | 检查 `coldstart_classes` 配置是否正确 |
| 反射调用 ClassNotFound | 添加 `-keep` 规则或排除对应 pass |
| 共享库加载失败 | 使用 `--page-align-libs` 保留 4K 对齐 |
| 构建时 protobuf 错误 | AAB 需 `--enable-protobuf` 且 protobuf >= 3.12.4 |
| Enum 相关崩溃 | 检查 OptimizeEnumsPass 限制条件（抽象/反射/非基本类型字段） |
| 接口 ClassCast | SingleImplPass 误删接口，添加 `-keep interface` 规则 |

## ProGuard 规则兼容

ReDex 仅支持简单 keep 指令防止类/接口被删除：

```
-keep interface com.example.MyInterface
```

通过 `-P` 参数传入：

```bash
redex.py input.apk -o output.apk -P proguard-rules.pro \
  --sign -s keystore -a alias -p android
```

高级 ProGuard 特性（方法级 keep、字段保留、通配符模式）目前不受支持。
