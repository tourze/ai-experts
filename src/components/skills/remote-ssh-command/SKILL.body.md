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
