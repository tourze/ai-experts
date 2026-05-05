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
