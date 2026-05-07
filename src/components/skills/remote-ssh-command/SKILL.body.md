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
调用对应 procedure；具体用法、参数和示例命令见下方 **Procedure 调用说明**。bash
printf '%s\n' 'systemctl status nginx | cat' | procedure `remote-ssh-command-ssh-exec` ~/.host/1.2.3.4.json
```
