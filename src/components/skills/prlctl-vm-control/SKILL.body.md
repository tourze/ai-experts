## 代码模式

### 模式 1：先解析唯一目标，再执行动作

```bash
node ./scripts/prlctl_helper.mjs list --json
node ./scripts/prlctl_helper.mjs resolve "Win11"
node ./scripts/prlctl_helper.mjs status "Win11"
node ./scripts/prlctl_helper.mjs info "Win11"
```

### 模式 2：先 dry-run，再进入客体执行

```bash
node ./scripts/prlctl_helper.mjs exec "Win11" --shell powershell --dry-run -- 'whoami'
node ./scripts/prlctl_helper.mjs exec "Win11" --current-user --shell powershell -- 'Get-Location'
node ./scripts/prlctl_helper.mjs exec "Ubuntu 24.04" --shell bash -- 'hostnamectl --static'
node ./scripts/prlctl_helper.mjs power "Win11" stop --option=--acpi --dry-run
node ./scripts/prlctl_helper.mjs snapshots "Win11"
```

### 模式 3：上传 / 下载文件

```bash
node ./scripts/prlctl_helper.mjs upload "Win11" --current-user --shell powershell -- ./local.txt 'C:\Users\air\Desktop\local.txt'
node ./scripts/prlctl_helper.mjs download "Win11" --current-user --shell powershell -- 'C:\Users\air\Desktop\result.zip' ./result.zip
node ./scripts/prlctl_helper.mjs upload "Ubuntu 24.04" --shell bash -- ./local.txt /tmp/local.txt
node ./scripts/prlctl_helper.mjs download "Ubuntu 24.04" --shell bash -- /tmp/result.tar.gz ./result.tar.gz
```

## 检查清单

- 目标虚拟机是否已经通过 `resolve` 变成唯一结果。
- 执行动作前是否已采集 `status` / `info` 作为基线证据。
- Windows 客体任务是否确认了执行上下文：服务态、当前登录用户，还是显式账户。
- 文件传输是否确认了方向、源路径、目标路径和覆盖风险。
- 排查挂起时是否避免读取 `/private/tmp/claude-*/*/tasks/*.output` 或输出完整长命令行。
- 使用 `--user` 时是否同时提供了 `--password-env`，并确认密码来自环境变量而非命令行明文。
- 高风险动作前是否确认快照、回滚路径和用户授权。

## 反模式

### FAIL: 模糊名称直接高风险

```bash
prlctl stop "Win"
# 匹配多个 VM（Win10 / Win11 / WinServer）→ 关闭了不该关的
```

### PASS: resolve 再执行

```bash
node scripts/prlctl_helper.mjs resolve "Win11"
# → 返回唯一 UUID
node scripts/prlctl_helper.mjs status "8f14e45f-ea6d-4f3c-9c7b-1f6a3d4b5e6f"
node scripts/prlctl_helper.mjs power "8f14e45f-ea6d-4f3c-9c7b-1f6a3d4b5e6f" stop --option=--acpi
```

### FAIL: 密码命令行明文

```bash
prlctl exec <uuid> --user=admin --password=SecretPass123 'whoami'
# 密码在 history / ps aux 可见
```

### PASS: --password-env

```bash
export VM_PWD='SecretPass123'
prlctl exec <uuid> --user=admin --password-env=VM_PWD 'whoami'
# 或 --current-user 走桌面登录态
```
