# Volatility 内存取证初筛命令

## 系统与进程

```bash
python3 vol.py -f mem.raw windows.info
python3 vol.py -f mem.raw windows.pslist
python3 vol.py -f mem.raw windows.pstree
python3 vol.py -f mem.raw windows.cmdline
```

## 网络、模块与句柄

```bash
python3 vol.py -f mem.raw windows.netscan
python3 vol.py -f mem.raw windows.dlllist --pid <pid>
python3 vol.py -f mem.raw windows.handles --pid <pid>
```

## 注入与导出

```bash
python3 vol.py -f mem.raw windows.malfind
python3 vol.py -f mem.raw windows.malfind --pid <pid> --dump
python3 vol.py -f mem.raw windows.dumpfiles --pid <pid>
```

每条可疑结论至少记录 PID、offset、进程路径、命令行、网络端点和关联时间戳。
