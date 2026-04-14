---
name: chipsec
description: "当需要用 CHIPSEC 对 UEFI/BIOS 固件镜像做离线解析、模块检查和已知风险核对时使用。"
---

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
- 在未知平台直接执行修改类模块。
- 混淆“镜像结构异常”和“已确认恶意”。
- 不保存原始 dump 就开始修改。
