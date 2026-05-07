# CHIPSEC 离线固件分析指南

## 范围

本 skill 只处理离线固件 dump 分析，不执行 live system 写操作或需要内核驱动的模块。

适合：

- `.bin`、`.rom`、`.fd`、`.cap`、`.scap` 固件镜像。
- EFI executable inventory、blocked threat scan、UEFI decode、NVRAM 提取。
- 固件更新前后 baseline comparison。

不适合：

- 直接修改 SPI flash。
- live BIOS write protection、SMM、Secure Boot 或 Boot Guard 检测。
- 需要 VirusTotal API 或 live S3 access 的模块。

## 常用 Flag

| Flag | 用途 |
|------|------|
| `-i` | 忽略平台检查，离线分析常用。 |
| `-n` | 不加载 kernel driver，离线只读分析必须使用。 |
| `-m` | 指定 CHIPSEC module。 |
| `-a` | 传递 module arguments。 |

## 核心命令

### 生成 EFI 模块清单

```bash
chipsec_main -i -n -m tools.uefi.scan_image -a generate inventory.json firmware.bin
```

用于生成 EFI executable inventory 和 SHA256，适合作为 baseline。

### 扫描已知威胁

```bash
chipsec_main -i -n -m tools.uefi.scan_blocked -a firmware.bin
```

用于检查 HackingTeam UEFI Rootkit、MosaicRegressor、LoJax、ThinkPwn、FirmwareBleed 等已知模式。

### 解码固件结构

```bash
chipsec_util -i -n uefi decode firmware.bin
```

用于提取 firmware volume、file、section，供后续手工检查。

### 提取 NVRAM

```bash
chipsec_util -i -n uefi nvram vss firmware.bin
chipsec_util -i -n uefi nvram nvar firmware.bin
```

优先尝试 VSS；AMI BIOS 常见 NVAR。

### baseline 对比

```bash
chipsec_main -i -n -m tools.uefi.scan_image -a check baseline.json firmware.bin
```

用于比较更新前后或 known-good baseline 与当前镜像。

## 标准 Workflow

```bash
TARGET="firmware.bin"
OUTPUT_DIR="./chipsec-analysis"
mkdir -p "$OUTPUT_DIR"
sha256sum "$TARGET" | tee "$OUTPUT_DIR/firmware.sha256"

chipsec_main -i -n -m tools.uefi.scan_image \
  -a generate "$OUTPUT_DIR/inventory.json" "$TARGET"

chipsec_main -i -n -m tools.uefi.scan_blocked \
  -a "$TARGET" 2>&1 | tee "$OUTPUT_DIR/blocked-scan.txt"

chipsec_util -i -n uefi decode "$TARGET" 2>&1 | tee "$OUTPUT_DIR/decode.txt"

chipsec_util -i -n uefi nvram vss "$TARGET" > "$OUTPUT_DIR/nvram-vss.txt" 2>&1
```

## 结果解释

| 结果 | 含义 |
|------|------|
| `PASSED` | 模块未发现该项问题。 |
| `WARNING` | 有可疑或需要人工确认的发现。 |
| `FAILED` | 模块认为安全检查失败。 |
| `ERROR` / module error | 先排查格式、参数、依赖和模块适用性，不直接当作安全发现。 |

常见 exit code：

| Code | 含义 |
|------|------|
| `0` | 检查通过。 |
| `2` | 发现安全问题或 warning。 |
| `16` | module error。 |
| `128` | module 不适用。 |

## 发现记录模板

```text
Finding:
- Firmware:
- SHA256:
- Module:
- CHIPSEC result:
- Affected GUID / file:
- Affected SHA256:
- Evidence file:
- Interpretation:
- Confidence:
- Next step:
```

## 排错

- 先用 `file firmware.bin` 和 `binwalk firmware.bin` 确认格式。
- `scan_image` 无输出时，检查是否为 capsule 包装或非 UEFI dump。
- logging 失败时，先确认当前工作目录可写，并把输出重定向到分析目录。
- blocked scan 命中后，用 UEFITool 或二进制分析确认 GUID、hash 和上下文。
