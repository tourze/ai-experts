---
name: nginx-config-optimizer
description: 当用户需要编写或优化 Nginx 的反向代理、TLS、安全头、缓存与限流配置时使用。
---

# Nginx 配置优化

## 适用场景
- 新建反向代理、静态站点或负载均衡配置。
- 调整 TLS、安全头、缓存和速率限制。
- 排查 502、超时、回源头信息缺失等代理问题。

## 核心约束
- 变更前先确认站点角色：静态服务、反向代理、负载均衡或 API 网关。
- 上线前必须执行 `nginx -t`，通过后再 reload。
- 生产配置优先 TLS 1.2/1.3、严格安全头和显式超时。
- 不要在全局默认块里塞入与单站点强耦合的 CSP、缓存或限流策略。

## 代码模式
- 反向代理骨架：

```nginx
upstream app_backend {
    least_conn;
    server 10.0.1.10:3000 max_fails=3 fail_timeout=30s;
    server 10.0.1.11:3000 max_fails=3 fail_timeout=30s;
}

server {
    listen 443 ssl http2;
    server_name app.example.com;

    ssl_certificate     /etc/letsencrypt/live/app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app/privkey.pem;

    location / {
        proxy_pass http://app_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }
}
```

- 发布前验证：

```bash
nginx -t
systemctl reload nginx
```

## 检查清单
- 是否明确上游地址、健康策略、超时和回源头信息。
- 是否配置 TLS 证书、HSTS、安全头和必要的限流规则。
- 是否区分静态缓存路径与动态回源路径。
- 是否在变更前后验证 `nginx -t` 与端点行为。
- 如果要做上线后巡检，参阅 [service-monitor](../service-monitor/SKILL.md)。
- 如果要补充告警与指标，参阅 [monitoring-observability](../monitoring-observability/SKILL.md)。

## 反模式

### FAIL: 反代不传 X-Forwarded-*

```nginx
location / {
    proxy_pass http://backend;
    # 忘记 X-Forwarded-For / -Proto
}
```

→ 后端所有请求 IP 都是 Nginx 本身，HTTPS 识别失败。

### PASS: 完整回源头

```nginx
location / {
    proxy_pass http://backend;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

### FAIL: 无限超时掩盖慢后端

```nginx
proxy_read_timeout 3600s;  # 慢请求堆积 → 连接池耗尽
```

### PASS: 显式超时 + 熔断

```nginx
proxy_connect_timeout 5s;
proxy_read_timeout 60s;
# 上游 max_fails=3 fail_timeout=30s 自动摘除
```

### FAIL: 未 -t 直接 reload

```bash
vim /etc/nginx/nginx.conf
systemctl reload nginx  # 语法错误 → 502
```

### PASS: 验证后 reload

```bash
nginx -t && systemctl reload nginx
```
