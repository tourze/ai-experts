## 配置格式

```json
{
  "host": "1.2.3.4",
  "port": 22,
  "user": "root",
  "timeoutSeconds": 120,
  "auth": {
    "type": "password",
    "password": "..."
  }
}
```

## 执行流程
1. 若本机缺少 `sshpass`，先运行 `node scripts/install-sshpass.mjs`。
2. 保存主机配置到 `~/.host/<host>.json`。
3. 用 `printf` 将远端命令写入 `stdin`，再调用执行脚本：

```bash
printf '%s\n' 'systemctl status nginx | cat' | node scripts/ssh-exec.mjs ~/.host/1.2.3.4.json
```

## 检查清单
- 是否确认 JSON 文件在 `~/.host/` 下，且只使用密码认证。
- 是否把远端命令放在 `stdin`，避免本地 shell 提前展开。
- 是否查看脚本退出码；本地退出码等于远端命令退出码，连接失败、配置错误、超时均为非零。
- 是否按需查看 `~/.host/<host>.history`，确认执行命令、退出码和耗时。

## 反模式

### FAIL: 把密码或命令拼进 CLI 参数

```bash
node scripts/ssh-exec.mjs --password secret --cmd 'rm -rf /tmp/x'
```

### PASS: 配置走 JSON，命令走 stdin

```bash
printf '%s\n' 'df -h' | node scripts/ssh-exec.mjs ~/.host/1.2.3.4.json
```
