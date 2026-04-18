---
name: performance-optimizer
description: 当用户要定位 Linux 主机卡顿、高 CPU、高内存、高 IO 或负载暴涨时使用。
context: fork
agent: linux-expert:system-diagnostician
---

# Linux 性能优化

## 适用场景

- 用户反馈系统变慢、负载飙高、构建变卡、内存不足、磁盘 IO 打满或想释放资源。
- 需要基线采样时，先运行 [system-diagnostics](../system-diagnostics/SKILL.md)。
- 若瓶颈来自磁盘占满或缓存垃圾，联动 [disk-cleanup](../disk-cleanup/SKILL.md)。

## 核心约束

- 没有基线就不优化；必须先量化 CPU、内存、IO、负载、主要进程。
- 优先使用可回滚动作：清缓存、停非关键进程、减少启动项、改调度前先采样。
- 不得默认关闭安全服务、删除业务数据或调整内核参数到不可恢复状态。
- 所有建议都要附带“预期收益”和“验证命令”。

## 代码模式

```bash
#!/usr/bin/env bash
set -euo pipefail

uptime
free -h
vmstat 1 5
ps -eo pid,ppid,cmd,%mem,%cpu --sort=-%cpu | head -15
ps -eo pid,ppid,cmd,%mem,%cpu --sort=-%mem | head -15
iostat -xz 1 3 2>/dev/null || true
```

```bash
#!/usr/bin/env bash
set -euo pipefail

service_name="cron"
systemctl list-unit-files --state=enabled --type=service | head -30
sudo systemctl status "$service_name" --no-pager
sudo journalctl -u "$service_name" -n 50 --no-pager
```

## 检查清单

- [ ] 记录 `uptime`、`free -h`、`vmstat`、`iostat`、Top N 进程。
- [ ] 判断瓶颈是 CPU、内存、IO、锁等待还是网络等待。
- [ ] 分清“一次性尖峰”和“持续高压”，避免对瞬时采样过拟合。
- [ ] 每个优化动作都带验证命令和回退方式。
- [ ] 清理缓存或日志后重新采样，确认指标真的下降。
- [ ] 若是端口或 DNS 导致的“假卡顿”，切到 [network-troubleshooter](../network-troubleshooter/SKILL.md)。

## 反模式

### FAIL: 无指标加机器

```
“系统慢” → “加 CPU 核 + 加内存”
→ 钱花了 / 还是慢
→ 真问题是某个进程 IO 等待 100%
```

### PASS: 先量化瓶颈

```bash
vmstat 1 5
# us / sy = CPU
# wa = IO wait（关键）
# si / so = swap（持续 > 0 = 内存压力）
ps -eo pid,cmd,%cpu,%mem --sort=-%cpu | head -10
iostat -xz 1 3
# 才决策：补 CPU / 补内存 / 修代码 / 修磁盘
```

### FAIL: 只看 %CPU

```bash
top → CPU 30% → “不高”
→ 实际 IO wait 60% / load avg 50（4 核机器）
→ 用户感觉极慢
```

### PASS: 多维度

```bash
uptime  # load avg
- load < CPU 核数 = 健康
- load = 2-3 倍 = 警告
- load > 5 倍 = 危险

iostat -xz 1 3  # %iowait
# > 30% = IO 瓶颈，CPU 数字会骗人
```
