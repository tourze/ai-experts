---
name: memory-forensics
description: "当需要分析 RAM 镜像中的进程、注入、网络连接、凭据痕迹或 rootkit 线索时使用。"
---

# 内存取证

## 适用场景
- 需要用 Volatility 等工具分析内存镜像的进程、模块、句柄、网络、注入和持久化痕迹。
- 需要与 [binary-analysis-patterns](../binary-analysis-patterns/SKILL.md) 联动定位可疑模块。
- 面对反调试或壳层样本时，可结合 [anti-reversing-techniques](../anti-reversing-techniques/SKILL.md) 解释运行时差异。

## 核心约束
- 保存原始镜像与哈希，所有分析基于副本进行。
- 先做时间线、进程树和网络基线，再提取载荷。
- 所有结论都要锚定对象偏移、PID、模块名或时间戳。
- 区分“未找到证据”和“证据表明不存在”。

## 代码模式
```bash
python3 vol.py -f mem.raw windows.info
python3 vol.py -f mem.raw windows.pslist
python3 vol.py -f mem.raw windows.netscan
```

## 检查清单
- 确认镜像来源、平台版本、采集时间和时区。
- 先看进程、命令行、网络、模块，再深入注入与句柄。
- 对可疑对象记录偏移和关联关系。
- 导出样本前说明证据完整性和命名规则。

## 反模式

### FAIL: 不确认镜像类型

```bash
python3 vol.py -f mem.raw windows.pslist
# Error: No suitable address space mapping found
# 因为镜像是 Linux 不是 Windows
```

### PASS: 先 windows.info / banners

```bash
# Windows
python3 vol.py -f mem.raw windows.info
# Linux
python3 vol.py -f mem.raw banners.Banners
# → 确认 OS / kernel / build → 选对插件 + symbol pack
```

### FAIL: 单插件下结论

```bash
python3 vol.py -f mem.raw windows.pslist
# 看到 svchost.exe → "正常"
# 实际：进程注入隐藏在 svchost 内
```

### PASS: 多插件交叉

```bash
windows.pslist        # 标准进程列表
windows.psscan        # 池扫描（能发现隐藏）
windows.pstree        # 父子关系
windows.malfind       # 可疑内存区域
windows.netscan       # 网络连接
# 4 个插件交叉 → 才能可靠判定
```

### FAIL: 改原始证据

```bash
vim mem.raw  # 编辑后哈希变化
# 法庭/审计完全不认这个证据
```

### PASS: 哈希 + 副本

```bash
sha256sum mem.raw > mem.raw.sha256
cp mem.raw mem.raw.copy
# 所有分析在 copy 上进行
# 完成后再次校验原始 hash 不变
```
