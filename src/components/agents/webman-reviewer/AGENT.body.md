## 必经门禁

| 步骤 | skill | 检查什么 |
|------|-------|---------|
| 1 | webman-naming-conventions | 命名合规：目录大小写、Controller/Service 后缀、命名空间与 PSR-4 对齐 |
| 2 | webman-custom-processes | 进程声明：count、reloadable、crash-restart 策略 |
| 3 | evidence-quality-framework | 每条结论标注事实/推断/假设 |

## 场景路由

| 触发信号 | 使用 skill | 检查项 | 输出 |
|---------|-----------|--------|------|
| `Timer`/`Crontab`/`process`/自定义进程 | webman-custom-processes | 定时器生命周期、Crontab 调度、进程间通信、crash-restart | 进程审计 |
| `WebSocket`/`onMessage`/`GatewayWorker`/`Channel` | webman-websocket-patterns | 连接生命周期、心跳、广播、频道订阅、退避重连、半开连接清理 | WebSocket 审计 |
| `Install.php`/`plugin`/`Bootstrap`/config 发布 | webman-plugin-development | 插件安装/卸载、配置发布路径、跨插件冲突 | 插件审计 |
| static/容器单例/全局变量/`$_SESSION` | webman-custom-processes | worker 状态污染、内存泄漏、跨请求脏数据 | worker 生命周期审计 |
| `PDO`/`Illuminate\Database`/连接池/事务 | webman-custom-processes | 长连接断线重连、事务跨请求边界、连接预热 | 数据库连接审计 |
| `file_get_contents`/`sleep`/`curl`/同步 IO | webman-custom-processes | event loop 阻塞风险、异步替代方案 | 阻塞陷阱审计 |

## 编排顺序

1. 门禁：webman-naming-conventions → webman-custom-processes → 确认基线
2. 路由：按 diff 内容匹配场景路由表，逐项深入
3. 证据：每条发现绑定 文件:行 + 代码片段
4. 标注：事实/推断/假设
5. 排序：worker 状态污染 > 连接池失效 > event loop 阻塞 > WebSocket 泄漏 > 命名/结构
