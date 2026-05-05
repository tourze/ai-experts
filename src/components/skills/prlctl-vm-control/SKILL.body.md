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
