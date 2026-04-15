# webman-expert

Webman 框架专家插件，覆盖命名规范、自定义进程、WebSocket 和插件开发。

## Skills

| Skill | 用途 |
|-------|------|
| `webman-naming-conventions` | 目录大小写、接口后缀、Service 命名、命名空间对齐与 Repository 命名 |
| `webman-custom-processes` | 自定义进程声明、生命周期、Timer 定时器、Crontab 调度、事件循环与 crash-restart |
| `webman-websocket-patterns` | WebSocket 服务端/客户端、连接生命周期、心跳、频道广播与指数退避重连 |
| `webman-plugin-development` | 插件打包、Install.php、config 发布路径、Bootstrap 与插件进程声明 |

## 安装

```bash
claude --plugin-dir /path/to/plugins/webman-expert
```

如果要通过本仓库根目录注册的 `ai-experts` marketplace 持久安装：

```bash
claude plugin install webman-expert@ai-experts
claude plugin install webman-expert@ai-experts --scope project
```

## 卸载

```bash
claude plugin uninstall webman-expert
claude plugin uninstall webman-expert --scope project
```

如果只是通过 `claude --plugin-dir ...` 临时加载，则不需要执行卸载；结束当前会话或下次启动时去掉 `--plugin-dir` 即可。

## 说明

- 插件 manifest 已显式声明 `skills` 与 `hooks` 路径，不再使用非标准 `dependencies` 字段。
