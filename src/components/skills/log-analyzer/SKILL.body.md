## 代码模式
- 常用筛选命令：

```bash
journalctl --since "30 minutes ago" -p err --no-pager
grep -in "timeout" /var/log/nginx/error.log | tail -50
jq 'select(.level == "error")' app.log | tail -20
```

- 时间线整理模板：

```text
时间线：
10:01:14 API 开始报 502
10:01:16 上游连接被拒绝
10:01:18 健康检查连续失败

推断：
最早异常在上游服务，而不是 Nginx
```
