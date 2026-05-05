# 固件静态安全分析

## 适用场景
- 需要对 `.bin`、`.rom`、`.fd`、`.cap` 等固件镜像做结构和安全配置分析。
- 需要在离线环境先做快速风险筛查，再决定是否进入更细的固件逆向。
- 需要结合 [binary-analysis-patterns](../binary-analysis-patterns/SKILL.md) 深挖 EFI 可执行模块。

## 核心约束
- 优先离线分析原始 dump；任何写入类动作都必须额外确认。
- 保留原始镜像哈希，所有派生产物放独立目录。
- 先确认平台、芯片组和镜像来源，再解释结果。
- 把平台限制、未知模块和工具误报单独标注。

## 代码模式
```bash
chipsec_main -m common.bios_wp
chipsec_main -m tools.uefi.scan_image -a firmware.bin
chipsec_util spi dump firmware.bin
```

## 检查清单
- 确认镜像来源、采集方式、哈希和平台信息。
- 检查写保护、SPI 描述符、UEFI 模块清单和可疑持久化痕迹。
- 把工具报错与真实发现分开记录。
- 需要写操作时，明确提示风险和回退方案。

## 反模式

### FAIL: 直接跑修改类模块

```bash
# 不确认平台直接：
chipsec_main -m tools.uefi.uefi_keyvar_fuzz
# 模块尝试写 NVRAM → 砖机 / 厂商保修失效
```

### PASS: 离线只读优先

```bash
# 1. 先 dump（已脱机或在隔离机器）
chipsec_util spi dump firmware.bin
# 2. 离线分析
chipsec_main -i -m common.bios_wp -n
# 3. 任何写操作都需要明确授权 + 备份 + 厂商工具支持
```

### FAIL: "异常"=恶意

```
"chipsec 发现 NVRAM 中有未识别变量"
→ 报告为"疑似 rootkit"
→ 实际：厂商 OEM 工具留的合法变量
```

### PASS: 区分异常与恶意

```
1. 与同型号干净基线对比
2. 查厂商已知 NVRAM 变量列表
3. 只有"已知恶意特征"或"主动操作系统的可疑代码"才升级
4. 报告区分：异常 / 可疑 / 已确认恶意
```
