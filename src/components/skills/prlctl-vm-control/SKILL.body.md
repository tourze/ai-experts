# prlctl-vm-control

## 适用场景

- 需要在 macOS 宿主机上列出、定位、开关机、挂起、恢复或查看 Parallels Desktop 虚拟机详情。
- 需要在 Windows 或 Linux 客体里执行离散命令、上传文件或下载文件，并优先复用 [辅助脚本](./scripts/prlctl_helper.mjs) 而不是手写长命令。
- 需要在隔离环境里复现 Windows 桌面自动化问题时，可联动 [windows-ui-automation](../windows-ui-automation/SKILL.md)。
- 需要在虚拟机里验证驱动、回调、VBS/HVCI 等低层问题时，可联动 [windows-kernel-security](../windows-kernel-security/SKILL.md)。
- 需要快速查常见命令模板时，读取 [操作配方](./references/recipes.md)；需要对外展示入口文案时，参考 [Agent 配置](./agents/openai.yaml)。

## 核心约束

- 先 `list` / `resolve`，后 `info` / `exec` / `power`；不要对模糊选择器直接做高风险动作。
- `--user` 必须与 `--password-env` 一起使用，避免触发交互式密码提示；桌面登录态任务优先 `--current-user`。
- `reset`、`stop --kill`、`snapshot-switch`、`snapshot-delete`、`prlctl set` 都属于高风险动作，只有用户明确要求时才执行。
- 优先把任务拆成多个可验证的小命令；失败时先保留 stdout / stderr，再缩小范围重试。
- 如果任务依赖 GUI、剪贴板、浏览器会话或登录态，不要假定 `prlctl exec` 默认上下文正确，必须先做身份验证。
- Windows 文本输出优先走 `--shell powershell`，helper 会用 Base64 envelope 规避中文输出在 `prlctl` / 终端链路中的编码损坏；只有需要完全手写进程参数时才用 `--shell raw`。
- 文件传输走 helper 的 `upload` / `download`，默认会分片传输并覆盖目标文件；传输敏感文件前先确认目标路径和登录上下文。
- 诊断 helper 挂起时只输出 PID、PPID、状态、运行时长和可执行文件名等摘要；不要把 Claude / CLI 临时任务输出、完整 `ps aux` 长命令行或 PowerShell/Base64 payload 直接贴回对话。

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
