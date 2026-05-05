## 适用场景
- 需要在 IDA 中批量重命名、搜索字节模式、遍历函数或基本块。
- 需要用 Hex-Rays 反编译器 API 读取或修改伪代码。
- 需要用 IDALib (IDA 9.0+) 做无 GUI 的批量分析。
- 需要与 [binary-analysis-patterns](../binary-analysis-patterns/SKILL.md) 配合做深入逆向。

## 核心约束
- 区分调试态 API (`read_dbg_byte`) 和 IDB 态 API (`get_db_byte`)。
- `idc.find_bytes()` 返回 `BADADDR` 时停止循环。
- Hex-Rays 反编译结果用 `str(dec)` 转文本，不要直接拼接对象。
- IDALib 模式必须 `import idapro` 在最前，且 `close_database()` 在最后。

## 代码模式

### 函数遍历

```python
for func in idautils.Functions():
    print("0x%x %s" % (func, idc.get_func_name(func)))
```

### 字节模式搜索

```python
ea = -1
while True:
    ea = idc.find_bytes("55 8B EC", ea + 1)
    if ea == ida_idaapi.BADADDR:
        break
    print(hex(ea))
```

### 交叉引用

```python
for ref in idautils.XrefsTo(target_ea):
    print("called from:", hex(ref.frm))
```

### Hex-Rays 反编译

```python
dec = ida_hexrays.decompile(func_addr)
print(str(dec))  # 转为可读伪代码
```

### IDALib 批量反编译 (IDA 9.0+)

```python
import idapro  # 必须第一行
import ida_hexrays, idautils, idc, json

ida.open_database("target.so", True)
result = []
for func in idautils.Functions():
    dec = ida_hexrays.decompile(func)
    if dec:
        result.append({"addr": hex(func), "name": idc.get_func_name(func), "code": str(dec)})
ida.close_database(save=False)
open("out.json", "w").write(json.dumps(result, indent=2))
```

## 检查清单
- 确认 IDA 版本（API 在 7.x / 8.x / 9.x 之间有重大变化）。
- `idaapi.FlowChart` 使用 `flags=idaapi.FC_PREDS` 获取前驱块。
- Appcall 需要在调试态执行，非调试态会抛异常。
- IDALib `close_database(save=True)` 会写 .idb，确认是否需要。

## 反模式

### FAIL: 直接在反编译中搜字符串

```python
for func in idautils.Functions():
    dec = str(ida_hexrays.decompile(func))
    if "password" in dec:  # 遍历几万个函数全部反编译
        print(hex(func))
# → 极慢，每个函数都调用 decompiler
```

### PASS: 先用字符串交叉引用缩小范围

```python
# 1. 找字符串地址
str_ea = idc.get_name_ea(0, "aPassword")
# 2. 找引用该字符串的函数
for ref in idautils.XrefsTo(str_ea):
    func = ida_funcs.get_func(ref.frm)
    if func:
        dec = ida_hexrays.decompile(func.start_ea)
        print(str(dec))
```
